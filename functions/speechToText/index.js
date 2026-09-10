"use strict";

const { jsonResponse, parseBody, sarvamSpeechToText } = require("./railsense");

module.exports = async (req, res) => {
  try {
    const body = await parseBody(req);
    if (!body.audioBase64) return jsonResponse(res, 400, { error: "audioBase64_required" });
    const result = await sarvamSpeechToText(body.audioBase64, body.language || "unknown");
    return jsonResponse(res, 200, { transcript: result.transcript || "", languageCode: result.language_code || null });
  } catch (error) {
    return jsonResponse(res, error.statusCode || 500, { error: "speech_to_text_failed", message: error.message });
  }
};
