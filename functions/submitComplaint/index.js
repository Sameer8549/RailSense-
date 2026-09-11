"use strict";

const catalyst = require("zcatalyst-sdk-node");
const {
  computeSeverity,
  extractPnrWithNvidia,
  extractWithGroqOrRules,
  generateComplaintId,
  getEnv,
  jsonResponse,
  lookupSeedPnr,
  parseBody,
  toClientComplaint,
  validatePnr
} = require("./railsense");

async function insertRow(table, row) {
  return table.insertRow(row);
}

async function safeRecurrenceCount(table, trainNumber, coach, issueTags) {
  if (!trainNumber || !coach || !issueTags.length) return 0;
  try {
    const rows = await table.getAllRows();
    const cutoff = Date.now() - 21 * 24 * 60 * 60 * 1000;
    return rows.filter((row) => {
      const created = new Date(row.createdAt || row.CREATEDTIME || 0).getTime();
      const tags = Array.isArray(row.issueTags) ? row.issueTags : [];
      return row.trainNumber === trainNumber &&
        row.coach === coach &&
        created >= cutoff &&
        tags.some((tag) => issueTags.includes(tag));
    }).length;
  } catch (_) {
    return 0;
  }
}

const FALLBACK_SCHEDULES = {
  "12951": [
    { station: "Vadodara Jn", haltMinutes: 7, eta: "13:48", status: "upcoming" },
    { station: "Ratlam Jn", haltMinutes: 10, eta: "16:32", status: "upcoming" }
  ],
  "12627": [
    { station: "Bhopal Jn", haltMinutes: 8, eta: "14:20", status: "upcoming" },
    { station: "Jhansi Jn", haltMinutes: 6, eta: "17:05", status: "upcoming" }
  ],
  "12723": [
    { station: "Balharshah Jn", haltMinutes: 10, eta: "14:22", status: "upcoming" },
    { station: "Nagpur", haltMinutes: 5, eta: "16:10", status: "upcoming" }
  ]
};

function normalizeScheduleRows(payload, trainNumber) {
  const data = payload?.data || payload;
  const rows = data?.route_schedule || data?.route || data?.schedule || data?.stations || [];
  if (!Array.isArray(rows) || !rows.length) return FALLBACK_SCHEDULES[String(trainNumber)] || [];
  return rows.map((row) => ({
    station: row.station_name || row.stationName || row.station || row.name || row.source_stn_name || "Upcoming station",
    haltMinutes: Number.parseInt(row.halt || row.haltTime || row.halt_time || row.stoppage_time || row.duration || 0, 10) || 0,
    eta: row.eta || row.arrival_time || row.arrivalTime || row.scharr || row.expected_arrival || "",
    status: String(row.status || row.train_status || "upcoming").toLowerCase()
  }));
}

function pickInterceptStop(schedule) {
  const upcoming = schedule.filter((stop) => !stop.status || stop.status === "upcoming");
  const candidates = upcoming.length ? upcoming : schedule;
  if (!candidates.length) return null;
  return candidates.find((stop) => Number(stop.haltMinutes || 0) >= 5) ||
    [...candidates].sort((a, b) => Number(b.haltMinutes || 0) - Number(a.haltMinutes || 0))[0];
}

async function fetchSchedule(trainNumber) {
  const key = getEnv("RAPIDAPI_KEY");
  if (!key) return { source: "fallback", schedule: FALLBACK_SCHEDULES[String(trainNumber)] || [] };
  const template = getEnv("IRCTC1_SCHEDULE_URL_TEMPLATE") || "https://irctc1.p.rapidapi.com/api/v1/getTrainSchedule?trainNo={trainNumber}";
  const url = template.replace("{trainNumber}", encodeURIComponent(trainNumber));
  const response = await fetch(url, {
    headers: {
      "content-type": "application/json",
      "x-rapidapi-host": getEnv("RAPIDAPI_HOST") || "irctc1.p.rapidapi.com",
      "x-rapidapi-key": key
    }
  });
  if (!response.ok) throw new Error(`IRCTC1 schedule failed: ${response.status}`);
  return { source: "rapidapi", schedule: normalizeScheduleRows(await response.json(), trainNumber) };
}

async function getCachedSchedule(datastore, trainNumber) {
  try {
    const table = datastore.table("TrainScheduleCache");
    const rows = await table.getAllRows();
    const hit = rows.find((row) => String(row.trainNumber || "") === String(trainNumber));
    const payload = hit?.scheduleJson ? JSON.parse(hit.scheduleJson) : null;
    const fresh = hit?.fetchedAt && Date.now() - new Date(hit.fetchedAt).getTime() < 5 * 60 * 1000;
    if (payload && fresh) return { source: "cache", schedule: normalizeScheduleRows(payload, trainNumber) };
  } catch (_) {}
  return null;
}

async function cacheSchedule(datastore, trainNumber, schedulePayload) {
  try {
    await datastore.table("TrainScheduleCache").insertRow({
      trainNumber,
      fetchedAt: new Date().toISOString(),
      scheduleJson: JSON.stringify(schedulePayload)
    });
  } catch (_) {}
}

async function resolveUnreservedLocation(datastore, trainNumber, coachZone) {
  const cached = await getCachedSchedule(datastore, trainNumber);
  const scheduleData = cached || await fetchSchedule(trainNumber);
  if (!cached) await cacheSchedule(datastore, trainNumber, scheduleData.schedule);
  const stop = pickInterceptStop(scheduleData.schedule);
  if (!stop) {
    return { error: "no_upcoming_stop", message: "No upcoming halt is available for this train.", coachZone, source: scheduleData.source };
  }
  return {
    station: stop.station,
    interceptStation: stop.station,
    halt_minutes: Number(stop.haltMinutes || 0),
    haltMinutes: Number(stop.haltMinutes || 0),
    eta: stop.eta || null,
    coachZone,
    source: scheduleData.source
  };
}

async function upsertInterceptTicket(datastore, trainNumber, intercept, complaintId) {
  if (!intercept?.station && !intercept?.interceptStation) return;
  try {
    const table = datastore.table("InterceptTickets");
    const rows = await table.getAllRows();
    const station = intercept.station || intercept.interceptStation;
    const open = rows.find((row) => String(row.trainNumber || "") === String(trainNumber) && row.interceptStation === station && row.status !== "closed");
    const issues = open?.issues ? JSON.parse(open.issues) : [];
    const nextIssues = Array.from(new Set([...issues, complaintId]));
    if (open) {
      return table.updateRow({ ...open, issues: JSON.stringify(nextIssues), updatedAt: new Date().toISOString() });
    }
    return table.insertRow({ trainNumber, interceptStation: station, issues: JSON.stringify(nextIssues), status: "open", createdAt: new Date().toISOString() });
  } catch (_) {}
}

module.exports = async (req, res) => {
  try {
    const app = catalyst.initialize(req);
    const body = await parseBody(req);
    const now = new Date().toISOString();

    if (!body.deviceId) {
      return jsonResponse(res, 400, { error: "deviceId_required" });
    }

    let pnrOcr = null;
    if (body.pnrPhotoBase64 && !body.pnr) {
      pnrOcr = await extractPnrWithNvidia(body.pnrPhotoBase64);
    }

    const ticketType = String(body.ticketType || body.ticket_type || "RESERVED").toUpperCase() === "UNRESERVED" ? "UNRESERVED" : "RESERVED";
    const extracted = await extractWithGroqOrRules(body);
    if (pnrOcr && pnrOcr.pnr && !extracted.pnr) extracted.pnr = pnrOcr.pnr;
    if (ticketType === "UNRESERVED") {
      extracted.pnr = "";
      extracted.coach = "";
      extracted.berth = "";
    }
    if (ticketType === "RESERVED" && !validatePnr(extracted.pnr)) {
      return jsonResponse(res, 422, { error: "invalid_pnr", message: "PNR must be exactly 10 digits." });
    }

    const pnrEntry = lookupSeedPnr(extracted.pnr);
    if (pnrEntry) {
      extracted.trainNumber = extracted.trainNumber || pnrEntry.trainNumber;
      extracted.coach = extracted.coach || pnrEntry.coach;
      extracted.berth = extracted.berth || pnrEntry.berth;
    }

    const datastore = app.datastore();
    const complaints = datastore.table("Complaints");
    const history = datastore.table("ComplaintStatusHistory");
    const recurrenceCount = await safeRecurrenceCount(complaints, extracted.trainNumber, extracted.coach, extracted.issueTags);
    const complaintId = generateComplaintId();
    const intercept = ticketType === "UNRESERVED"
      ? await resolveUnreservedLocation(datastore, extracted.trainNumber, body.coachZone || "Middle")
      : null;
    const complaint = {
      complaintId,
      ticket_type: ticketType,
      ticketType,
      identifier_number: ticketType === "UNRESERVED" ? (body.utsNumber || body.identifier_number || null) : null,
      pnr: extracted.pnr || null,
      trainNumber: extracted.trainNumber || null,
      coach: extracted.coach || null,
      berth: extracted.berth || null,
      coachZone: ticketType === "UNRESERVED" ? (body.coachZone || "Middle") : null,
      intercept,
      language: body.language || "en",
      rawTranscript: body.transcript || "",
      issueTags: extracted.issueTags,
      issueLabels: extracted.issueLabels,
      severity: computeSeverity(extracted.issueTags, recurrenceCount),
      status: "filed",
      // Evidence is resized in the passenger app before it reaches this payload.
      evidencePhotoUrl: body.evidencePhotoBase64 || null,
      evidenceAudioUrl: null,
      pnrPhotoUrl: body.pnrPhotoBase64 || null,
      deviceId: body.deviceId,
      createdAt: now,
      updatedAt: now
    };

    const historyRow = { complaintId, status: "filed", timestamp: now, note: null };
    await insertRow(complaints, { complaintId, payload: JSON.stringify(complaint) });
    await insertRow(history, { complaintId, payload: JSON.stringify(historyRow) });
    if (ticketType === "UNRESERVED") await upsertInterceptTicket(datastore, extracted.trainNumber, intercept, complaintId);

    return jsonResponse(res, 200, {
      complaint: toClientComplaint(complaint, [historyRow]),
      pnrOcr,
      integrations: { groq: "real", nvidiaNim: body.pnrPhotoBase64 ? "real" : "not_used", sarvam: "not_used" }
    });
  } catch (error) {
    return jsonResponse(res, error.statusCode || 500, { error: "submit_failed", message: error.message });
  }
};
