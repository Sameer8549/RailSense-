"use strict";

const catalyst = require("zcatalyst-sdk-node");
const { jsonResponse, parseBody, toClientComplaint } = require("./railsense");

function parsePayload(row) {
  if (!row) return null;
  if (row.payload) {
    try { return JSON.parse(row.payload); } catch (_) { return row; }
  }
  return row;
}

function normalizeComplaintId(value) {
  return String(value || "").trim().toUpperCase();
}

function getComplaintId(row) {
  const payload = parsePayload(row);
  return normalizeComplaintId(row?.complaintId || row?.id || payload?.complaintId || payload?.id);
}

module.exports = async (req, res) => {
  try {
    const app = catalyst.initialize(req);
    const body = await parseBody(req);
    const complaintId = normalizeComplaintId(body.complaintId || body.id);
    if (!/^RS-\d{4}-\d{5}$/.test(complaintId)) {
      return jsonResponse(res, 404, { error: "not_found" });
    }

    const datastore = app.datastore();
    const complaints = datastore.table("Complaints");
    const historyTable = datastore.table("ComplaintStatusHistory");
    const rows = await complaints.getAllRows();
    const row = rows.find((item) => getComplaintId(item) === complaintId);
    if (!row) return jsonResponse(res, 404, { error: "not_found" });
    const complaint = parsePayload(row);

    const historyRows = await historyTable.getAllRows();
    const history = historyRows
      .map(parsePayload)
      .filter((item) => normalizeComplaintId(item?.complaintId || item?.id) === complaintId)
      .sort((a, b) => new Date(a.timestamp || a.CREATEDTIME) - new Date(b.timestamp || b.CREATEDTIME));

    return jsonResponse(res, 200, { complaint: toClientComplaint(complaint, history) });
  } catch (error) {
    return jsonResponse(res, 500, { error: "track_failed", message: error.message });
  }
};
