"use strict";

const catalyst = require("zcatalyst-sdk-node");
const { getEnv, jsonResponse, parseBody } = require("./railsense");

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
  const response = await fetch(template.replace("{trainNumber}", encodeURIComponent(trainNumber)), {
    headers: {
      "content-type": "application/json",
      "x-rapidapi-host": getEnv("RAPIDAPI_HOST") || "irctc1.p.rapidapi.com",
      "x-rapidapi-key": key
    }
  });
  if (!response.ok) throw new Error(`IRCTC1 schedule failed: ${response.status}`);
  return { source: "rapidapi", schedule: normalizeScheduleRows(await response.json(), trainNumber) };
}

module.exports = async (req, res) => {
  try {
    catalyst.initialize(req);
    const body = await parseBody(req);
    const trainNumber = String(body.trainNumber || body.train || "").replace(/\D/g, "").slice(0, 5);
    if (!/^\d{5}$/.test(trainNumber)) return jsonResponse(res, 422, { error: "invalid_train_number" });
    const data = await fetchSchedule(trainNumber);
    const stop = pickInterceptStop(data.schedule);
    if (!stop) {
      return jsonResponse(res, 200, { error: "no_upcoming_stop", message: "No upcoming halt is available for this train.", coachZone: body.coachZone || "Middle", source: data.source });
    }
    return jsonResponse(res, 200, {
      interceptStation: stop.station,
      station: stop.station,
      haltMinutes: Number(stop.haltMinutes || 0),
      halt_minutes: Number(stop.haltMinutes || 0),
      eta: stop.eta || null,
      coachZone: body.coachZone || "Middle",
      source: data.source
    });
  } catch (error) {
    return jsonResponse(res, error.statusCode || 500, { error: "resolve_unreserved_failed", message: error.message });
  }
};
