"use strict";

const { jsonResponse, parseBody, sarvamTextToSpeech } = require("./railsense");

module.exports = async (req, res) => {
  try {
    const body = await parseBody(req);
    if (!body.text) return jsonResponse(res, 400, { error: "text_required" });
    const result = await sarvamTextToSpeech(body.text, body.language || "en");
    return jsonResponse(res, 200, { audioBase64: (result.audios || []).join(""), requestId: result.request_id || null });
  } catch (error) {
    return jsonResponse(res, error.statusCode || 500, { error: "text_to_speech_failed", message: error.message });
  }
};
