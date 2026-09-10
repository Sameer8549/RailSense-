"use strict";

const catalyst = require("zcatalyst-sdk-node");
const {
  computeSeverity,
  extractPnrWithNvidia,
  extractWithGroqOrRules,
  generateComplaintId,
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

    const extracted = await extractWithGroqOrRules(body);
    if (pnrOcr && pnrOcr.pnr && !extracted.pnr) extracted.pnr = pnrOcr.pnr;
    if (!validatePnr(extracted.pnr)) {
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
    const complaint = {
      complaintId,
      pnr: extracted.pnr || null,
      trainNumber: extracted.trainNumber || null,
      coach: extracted.coach || null,
      berth: extracted.berth || null,
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

    return jsonResponse(res, 200, {
      complaint: toClientComplaint(complaint, [historyRow]),
      pnrOcr,
      integrations: { groq: "real", nvidiaNim: body.pnrPhotoBase64 ? "real" : "not_used", sarvam: "not_used" }
    });
  } catch (error) {
    return jsonResponse(res, error.statusCode || 500, { error: "submit_failed", message: error.message });
  }
};
