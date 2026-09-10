"use strict";

const { extractWithGroqOrRules, jsonResponse, parseBody } = require("./railsense");

module.exports = async (req, res) => {
  try {
    const body = await parseBody(req);
    if (!body.transcript) return jsonResponse(res, 400, { error: "transcript_required" });
    const extracted = await extractWithGroqOrRules(body);
    return jsonResponse(res, 200, {
      issues: extracted.issueLabels,
      issueTags: extracted.issueTags,
      pnr: extracted.pnr || "",
      train: extracted.trainNumber || "",
      trainNumber: extracted.trainNumber || "",
      coach: extracted.coach || "",
      berth: extracted.berth || ""
    });
  } catch (error) {
    return jsonResponse(res, error.statusCode || 500, { error: "analyze_failed", message: error.message });
  }
};
