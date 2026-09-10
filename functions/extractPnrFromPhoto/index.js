"use strict";

const { extractPnrWithNvidia, jsonResponse, parseBody } = require("./railsense");

module.exports = async (req, res) => {
  try {
    const body = await parseBody(req);
    if (!body.pnrPhotoBase64) return jsonResponse(res, 400, { error: "pnrPhotoBase64_required" });
    const result = await extractPnrWithNvidia(body.pnrPhotoBase64);
    return jsonResponse(res, 200, result);
  } catch (error) {
    return jsonResponse(res, error.statusCode || 500, { error: "pnr_ocr_failed", message: error.message });
  }
};
