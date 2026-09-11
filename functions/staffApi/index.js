"use strict";

const crypto = require("crypto");
const catalyst = require("zcatalyst-sdk-node");
const { jsonResponse, parseBody, toClientComplaint } = require("./railsense");

const STAFF = [
  { id: "TTE-104", pinHash: sha256("0000"), name: "Demo TTE", role: "tte", train: null, coach: null },
  { id: "ADM-003", pinHash: sha256("0000"), name: "Demo Admin", role: "admin", train: null, coach: null },
  { id: "TTE-101", pinHash: sha256("1234"), name: "Ramesh Kumar", role: "tte", train: "12951", coach: null },
  { id: "ADM-001", pinHash: sha256("9999"), name: "Vikram Singh", role: "admin", train: null, coach: null }
];

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

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

function complaintIdOf(row, complaint) {
  return normalizeComplaintId(complaint?.complaintId || complaint?.id || row?.complaintId || row?.id);
}

function publicStaff(staff) {
  return staff ? { id: staff.id, staffId: staff.id, name: staff.name, role: staff.role, train: staff.train, coach: staff.coach } : null;
}

function statusForAction(actionType, outcome) {
  return ({
    resolve: "resolved",
    escalate: "escalated",
    assign: "assigned",
    schedule_inspection: "inspectionScheduled",
    verify_held: "verified",
    verify_failed: "open",
    merge: "merged",
    mark_duplicate: "duplicate"
  })[actionType] || (outcome === "failed" ? "open" : null);
}

function buildActionPlan(complaint, client, recurrenceCount) {
  const tags = client.issueTags || [];
  const isIntercept = (client.ticketType || complaint.ticket_type) === "UNRESERVED";
  const highRisk = tags.includes("safety") || client.severity === "high";
  const recurring = recurrenceCount > 2;
  const hasTicket = !!(complaint.pnrPhotoUrl || complaint.pnrPhotoBase64);
  const steps = [];
  if (isIntercept) steps.push(`Dispatch platform crew to ${client.intercept?.station || client.intercept?.interceptStation || "the resolved intercept station"} for the ${client.coachZone || "middle"} general coach.`);
  if (highRisk) steps.push("TTE to verify the passenger location and immediate safety condition.");
  if (tags.includes("ac_cooling")) steps.push("Inspect coach HVAC controls and log the coach-level fault.");
  if (tags.includes("toilet_unclean") || tags.includes("cleanliness")) steps.push("Assign onboard housekeeping and capture a post-service verification.");
  if (tags.includes("overcharging")) steps.push("Preserve the evidence, verify the vendor transaction, and route to commercial control.");
  if (recurring) steps.push("Escalate the recurrence pattern to maintenance with the affected coach context.");
  if (hasTicket) steps.push("Use the ticket document to confirm train, coach, berth, and passenger context.");
  if (!steps.length) steps.push("Acknowledge the passenger, inspect on site, and record the resolution evidence.");
  return {
    priority: highRisk ? "immediate" : recurring ? "priority" : "standard",
    recommendedAction: isIntercept
      ? `Intercept at ${client.intercept?.station || client.intercept?.interceptStation || "next suitable halt"}${client.intercept?.eta ? ` by ${client.intercept.eta}` : ""}; alert platform staff for ${client.coachZone || "middle"} general coach.`
      : highRisk ? "Verify on site, then escalate to the duty controller." : recurring ? "Assign maintenance and schedule an inspection." : "Assign the case and complete an on-site verification.",
    steps
  };
}

function mapComplaintToIncident(complaint, history = [], interceptIssues = []) {
  const client = toClientComplaint(complaint, history);
  const status = client.currentStatus || "filed";
  const issueTags = client.issueTags && client.issueTags.length ? client.issueTags : ["general"];
  const recurrenceCount = Number(complaint.recurrenceCount || Math.max(1, history.length));
  const evidencePhotoUrl = complaint.evidencePhotoUrl || complaint.evidencePhotoBase64 || null;
  const ticketPhotoUrl = complaint.pnrPhotoUrl || complaint.pnrPhotoBase64 || null;
  const images = [];
  if (evidencePhotoUrl) images.push({ url: evidencePhotoUrl, caption: "Passenger evidence" });
  if (ticketPhotoUrl) images.push({ url: ticketPhotoUrl, caption: "Ticket document" });
  const actionPlan = buildActionPlan(complaint, client, recurrenceCount);
  const ticketType = client.ticketType || complaint.ticket_type || "RESERVED";
  const intercept = client.intercept || complaint.intercept || null;
  return {
    ...client,
    id: client.id,
    title: client.summary,
    category: client.issues?.[0] || "Railway complaint",
    summary: client.summary,
    train: client.trainNumber || client.train || "Unknown",
    trainName: complaint.trainName || "",
    ticketType,
    ticket_type: ticketType,
    identifier_number: client.identifier_number || complaint.identifier_number || null,
    utsNumber: client.utsNumber || complaint.utsNumber || complaint.identifier_number || null,
    coachZone: client.coachZone || complaint.coachZone || null,
    intercept,
    interceptIssues,
    interceptRouting: ticketType === "UNRESERVED",
    coach: ticketType === "UNRESERVED" ? null : (client.coach || "NA"),
    berth: client.berth || null,
    issueTypes: issueTags.map((tag) => tag.replace("_unclean", "").replace("_cooling", "")),
    severity: client.severity,
    status,
    currentStatus: status,
    filedAt: client.timestamp,
    assignee: complaint.assignee || null,
    recurrenceCount,
    recurrencePeriod: complaint.recurrencePeriod || "21 days",
    evidence: {
      hasPhoto: !!evidencePhotoUrl,
      hasAudio: !!complaint.evidenceAudioUrl,
      confidence: complaint.evidenceConfirmed ? "verified" : "medium",
      images,
      audioUrl: complaint.evidenceAudioUrl || null
    },
    actions: complaint.actions || [],
    history,
    aiSummary: complaint.aiSummary || client.summary,
    rootCause: complaint.rootCause || (recurrenceCount > 2 ? "Recurring issue pattern detected on the same train/coach." : "Single incident; monitor for recurrence."),
    recommendedAction: complaint.recommendedAction || actionPlan.recommendedAction,
    actionPlan,
    recurrenceForecast: complaint.recurrenceForecast || {
      probability: client.severity === "high" ? 0.82 : 0.35,
      nextOccurrenceDays: client.severity === "high" ? 3 : 14,
      basis: "Rule-based forecast from severity, recency, and repeated coach complaints."
    },
    resolvedAttempts: complaint.resolvedAttempts || [],
    resolutionHeld: complaint.resolutionHeld ?? null
  };
}

async function getComplaints(datastore) {
  const complaints = await datastore.table("Complaints").getAllRows();
  let historyRows = [];
  let interceptRows = [];
  try {
    historyRows = await datastore.table("ComplaintStatusHistory").getAllRows();
  } catch (_) {}
  try {
    interceptRows = await datastore.table("InterceptTickets").getAllRows();
  } catch (_) {}
  const historyById = new Map();
  for (const row of historyRows) {
    const item = parsePayload(row);
    if (!item?.complaintId) continue;
    if (!historyById.has(item.complaintId)) historyById.set(item.complaintId, []);
    historyById.get(item.complaintId).push(item);
  }
  const interceptIssuesByRoute = new Map();
  for (const row of interceptRows) {
    let issues = [];
    try { issues = row.issues ? JSON.parse(row.issues) : []; } catch (_) {}
    interceptIssuesByRoute.set(`${row.trainNumber || ""}|${row.interceptStation || ""}`, issues);
  }
  const entries = complaints.map((row) => {
    const complaint = parsePayload(row);
    if (complaint && !complaint.complaintId) complaint.complaintId = row.complaintId || row.id;
    const history = (historyById.get(complaint.complaintId) || [])
      .sort((a, b) => new Date(a.timestamp || a.CREATEDTIME) - new Date(b.timestamp || b.CREATEDTIME));
    return { rawRow: row, complaint, history };
  });
  for (const entry of entries) {
    const complaint = entry.complaint || {};
    if ((complaint.ticketType || complaint.ticket_type) !== "UNRESERVED") continue;
    const station = complaint.intercept?.station || complaint.intercept?.interceptStation || "";
    const key = `${complaint.trainNumber || complaint.train || ""}|${station}`;
    const existing = interceptIssuesByRoute.get(key) || [];
    interceptIssuesByRoute.set(key, Array.from(new Set([...existing, complaint.complaintId])));
  }
  return entries.map((entry) => {
    const complaint = entry.complaint || {};
    const station = complaint.intercept?.station || complaint.intercept?.interceptStation || "";
    const interceptIssues = interceptIssuesByRoute.get(`${complaint.trainNumber || complaint.train || ""}|${station}`) || [];
    return { rawRow: entry.rawRow, complaint, incident: mapComplaintToIncident(complaint, entry.history, interceptIssues) };
  });
}

async function insertPayload(datastore, tableName, keyName, keyValue, payload) {
  try {
    await datastore.table(tableName).insertRow({ [keyName]: keyValue, payload: JSON.stringify(payload) });
  } catch (_) {
    // Demo resilience: core status updates must not fail if optional audit tables are not created yet.
  }
}

async function updateComplaint(datastore, row, complaint) {
  const table = datastore.table("Complaints");
  const next = { ...row, complaintId: complaint.complaintId, payload: JSON.stringify(complaint) };
  if (row.ROWID && typeof table.updateRow === "function") return table.updateRow(next);
  await table.insertRow({ complaintId: complaint.complaintId, payload: JSON.stringify(complaint) });
}

function analytics(incidents) {
  const open = incidents.filter((i) => !["resolved", "verified", "duplicate", "merged"].includes(i.currentStatus));
  const bySeverity = ["high", "medium", "low"].map((name) => ({ name, value: incidents.filter((i) => i.severity === name).length }));
  const byIssue = {};
  for (const inc of incidents) for (const type of inc.issueTypes || []) byIssue[type] = (byIssue[type] || 0) + 1;
  return {
    kpis: { total: incidents.length, open: open.length, high: incidents.filter((i) => i.severity === "high").length, resolved: incidents.filter((i) => i.currentStatus === "resolved").length },
    severityDistribution: bySeverity,
    recurringLeaderboard: Object.entries(byIssue).map(([issueType, count]) => ({ issueType, count })).sort((a, b) => b.count - a.count).slice(0, 8),
    volumeTrend: incidents.slice(-14).map((i) => ({ date: (i.filedAt || "").slice(0, 10), count: 1 })),
    verificationOutcomeRate: { held: incidents.filter((i) => i.resolutionHeld === true).length, failed: incidents.filter((i) => i.resolutionHeld === false).length }
  };
}

module.exports = async (req, res) => {
  try {
    const app = catalyst.initialize(req);
    const datastore = app.datastore();
    const body = await parseBody(req);
    const op = body.op || body.action || "getUpdatesSince";

    if (op === "loginStaff") {
      const staffId = String(body.staffId || "").trim().toUpperCase();
      const staff = STAFF.find((item) => item.id === staffId && item.pinHash === sha256(body.pin || ""));
      if (!staff) return jsonResponse(res, 401, { error: "invalid_login" });
      return jsonResponse(res, 200, { staff: publicStaff(staff), session: publicStaff(staff) });
    }

    const records = await getComplaints(datastore);
    if (op === "getUpdatesSince") {
      const since = body.lastCheckedTimestamp ? new Date(body.lastCheckedTimestamp).getTime() : 0;
      const incidents = records.map((r) => r.incident);
      return jsonResponse(res, 200, {
        serverTime: new Date().toISOString(),
        incidents: incidents.filter((i) => !since || new Date(i.filedAt || 0).getTime() >= since - 1000),
        allIncidents: body.includeAll ? incidents : undefined
      });
    }

    if (op === "getAnalytics" || op === "getFleetOverview" || op === "getComplaintFrequencyByCoach") {
      const incidents = records.map((r) => r.incident);
      return jsonResponse(res, 200, { analytics: analytics(incidents), incidents });
    }

    const staff = STAFF.find((item) => item.id === String(body.staffId || "").trim().toUpperCase());
    if (!staff) return jsonResponse(res, 401, { error: "invalid_staff" });
    const complaintId = normalizeComplaintId(body.complaintId || body.incidentId || body.id);
    const record = records.find((item) => complaintIdOf(item.rawRow, item.complaint) === complaintId || normalizeComplaintId(item.incident.id) === complaintId);
    if (!record) return jsonResponse(res, 404, { error: "not_found" });

    const now = new Date().toISOString();
    const previous = { status: record.complaint.status, severity: record.complaint.severity, assignee: record.complaint.assignee };
    const actionMap = {
      markAction: "resolve",
      resolveIncident: "resolve",
      escalate: "escalate",
      escalateIncident: "escalate",
      assignMaintenance: "assign",
      assignIncident: "assign",
      scheduleInspection: "schedule_inspection",
      verifyResolution: "verify_held",
      markResolutionFailed: "verify_failed",
      mergeIncidents: "merge",
      adjustSeverity: "adjust_severity",
      confirmOnSite: "confirm_onsite",
      markDuplicate: "mark_duplicate"
    };
    const actionType = actionMap[op] || actionMap[body.type] || body.type || op;
    const next = { ...record.complaint, updatedAt: now };
    const nextStatus = statusForAction(actionType, body.outcome);
    if (nextStatus) next.status = nextStatus;
    if (actionType === "assign") next.assignee = body.assignedTo || body.assignee || body.payload?.assignee || `${staff.id} ${staff.name}`;
    if (actionType === "adjust_severity" && body.newSeverity) next.severity = body.newSeverity;
    if (actionType === "confirm_onsite") next.evidenceConfirmed = true;
    if (actionType === "verify_failed") next.resolutionHeld = false;
    if (actionType === "verify_held") next.resolutionHeld = true;

    const action = {
      actionId: `ACT-${Date.now()}`,
      complaintId,
      staffId: staff.id,
      actionType,
      note: body.note || body.reason || body.reasonCode || null,
      timestamp: now,
      previousValue: previous,
      newValue: { status: next.status, severity: next.severity, assignee: next.assignee }
    };
    next.actions = [...(next.actions || []), { by: `${staff.id} ${staff.name}`, at: now, type: actionType, note: action.note }];
    const history = { complaintId, status: next.status || "updated", timestamp: now, note: action.note };

    await updateComplaint(datastore, record.rawRow, next);
    await insertPayload(datastore, "ComplaintStatusHistory", "complaintId", complaintId, history);
    await insertPayload(datastore, "Actions", "actionId", action.actionId, action);

    return jsonResponse(res, 200, { complaint: toClientComplaint(next, [history]), incident: mapComplaintToIncident(next, [history]), action });
  } catch (error) {
    return jsonResponse(res, error.statusCode || 500, { error: "staff_api_failed", message: error.message });
  }
};
