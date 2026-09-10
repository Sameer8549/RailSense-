"use strict";

const DEFAULT_PNR_DIRECTORY = [
  { pnr: "4521987630", trainNumber: "12951", trainName: "Mumbai Rajdhani Express", coach: "B2", berth: "42" },
  { pnr: "7634512980", trainNumber: "12953", trainName: "August Kranti Rajdhani", coach: "A1", berth: "18" },
  { pnr: "3310987562", trainNumber: "12627", trainName: "Karnataka Express", coach: "S4", berth: "09" },
  { pnr: "8821047532", trainNumber: "12615", trainName: "Grand Trunk Express", coach: "B1", berth: "31" },
  { pnr: "5901234786", trainNumber: "12723", trainName: "Telangana Express", coach: "S2", berth: "55" },
  { pnr: "1045678923", trainNumber: "12621", trainName: "Tamil Nadu Express", coach: "A2", berth: "07" },
  { pnr: "6789012345", trainNumber: "16587", trainName: "Yesvantpur Bikaner Express", coach: "B3", berth: "24" }
];

const ISSUE_RULES = [
  { tag: "ac_cooling", label: "AC not working", weight: 4, terms: ["ac", "air", "cooling", "cold", "hot", "ventilation"] },
  { tag: "cleanliness", label: "Coach dirty", weight: 2, terms: ["dirty", "clean", "garbage", "smell", "stain", "filthy"] },
  { tag: "overcharging", label: "Overcharging", weight: 3, terms: ["overcharg", "extra money", "price", "charged", "money"] },
  { tag: "toilet_unclean", label: "Toilet unclean", weight: 3, terms: ["toilet", "bathroom", "washroom"] },
  { tag: "food_quality", label: "Poor food quality", weight: 2, terms: ["food", "meal", "pantry", "quality"] },
  { tag: "safety", label: "Safety concern", weight: 5, terms: ["unsafe", "safety", "theft", "stolen", "harass", "fight", "threat"] }
];

function jsonResponse(res, statusCode, body) {
  const responseBody = JSON.stringify(body);
  if (res && typeof res.status === "function") {
    res.status(statusCode);
    res.setHeader("content-type", "application/json");
    return res.send(responseBody);
  }
  if (res && typeof res.writeHead === "function") {
    res.writeHead(statusCode, { "content-type": "application/json" });
    return res.end(responseBody);
  }
  if (res && typeof res.end === "function") {
    class IntegResponse {
      buildResponse() {
        return { status: statusCode, contentType: "application/json", responseBody };
      }
    }
    return res.end(new IntegResponse());
  }
  return { status: statusCode, contentType: "application/json", responseBody };
}

function parseBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  if (typeof req.body === "string" && req.body.trim()) return Promise.resolve(JSON.parse(req.body));
  if (!req || typeof req.on !== "function") return Promise.resolve({});

  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function normalizeStatus(status) {
  return status === "under_review" ? "underReview" : status;
}

function toClientComplaint(row, history) {
  const id = row.complaintId || row.id;
  const issueLabels = Array.isArray(row.issueLabels) ? row.issueLabels : tagsToLabels(row.issueTags || row.issues || []);
  const createdAt = row.createdAt || row.CREATEDTIME || new Date().toISOString();
  return {
    id,
    complaintId: id,
    timestamp: createdAt,
    summary: summarizeComplaint(issueLabels, row.rawTranscript),
    train: row.trainNumber || row.train || null,
    trainNumber: row.trainNumber || row.train || null,
    coach: row.coach || null,
    berth: row.berth || null,
    pnr: row.pnr || null,
    issues: issueLabels,
    issueTags: row.issueTags || [],
    severity: row.severity || "low",
    currentStatus: normalizeStatus(row.status || "filed"),
    steps: (history || []).map((item) => ({
      status: normalizeStatus(item.status),
      timestamp: item.timestamp || item.createdAt || item.CREATEDTIME,
      note: item.note || null
    }))
  };
}

function tagsToLabels(tags) {
  return (Array.isArray(tags) ? tags : []).map((tag) => {
    const rule = ISSUE_RULES.find((item) => item.tag === tag || item.label === tag);
    return rule ? rule.label : String(tag);
  });
}

function summarizeComplaint(issueLabels, transcript) {
  if (issueLabels && issueLabels.length) {
    return issueLabels.slice(0, 2).join(", ") + (issueLabels.length > 2 ? ` +${issueLabels.length - 2} more` : "");
  }
  return transcript ? transcript.slice(0, 60) : "General complaint";
}

function extractComplaintFields(input) {
  const transcript = String(input.transcript || input.rawTranscript || "");
  const lower = transcript.toLowerCase();
  const matchedRules = ISSUE_RULES.filter((rule) => rule.terms.some((term) => lower.includes(term)));
  const rules = matchedRules.length ? matchedRules : [{ tag: "general", label: "General complaint", weight: 1 }];
  const pnrMatch = transcript.match(/\b(\d{10})\b/);
  const trainMatch = transcript.match(/\b(\d{5})\b/);
  const coachMatch = transcript.match(/\b([A-Z]{1,2}\d{1,2})\b/i);

  return {
    issueTags: rules.map((rule) => rule.tag),
    issueLabels: rules.map((rule) => rule.label),
    pnr: input.pnr || (pnrMatch ? pnrMatch[1] : ""),
    trainNumber: input.trainNumber || input.train || (trainMatch ? trainMatch[1] : ""),
    coach: input.coach || (coachMatch ? coachMatch[1].toUpperCase() : ""),
    berth: input.berth || ""
  };
}

function validatePnr(pnr) {
  return !pnr || /^\d{10}$/.test(String(pnr));
}

function lookupSeedPnr(pnr) {
  return DEFAULT_PNR_DIRECTORY.find((item) => item.pnr === pnr) || null;
}

function computeSeverity(issueTags, recurrenceCount) {
  const base = (issueTags || []).reduce((sum, tag) => {
    const rule = ISSUE_RULES.find((item) => item.tag === tag);
    return sum + (rule ? rule.weight : 1);
  }, 0);
  const score = base + Math.min(Number(recurrenceCount || 0), 5);
  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  return "low";
}

function generateComplaintId() {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `RS-${new Date().getFullYear()}-${num}`;
}

function getEnv(name) {
  return process.env[name] || process.env[`CATALYST_${name}`] || "";
}

function requireEnv(name) {
  const value = getEnv(name);
  if (!value) {
    const error = new Error(`${name} is not configured in Catalyst environment variables.`);
    error.statusCode = 503;
    throw error;
  }
  return value;
}

async function callGroqExtractor(input) {
  const key = requireEnv("GROQ_API_KEY");
  const schema = {
    type: "object",
    properties: {
      issueTags: {
        type: "array",
        items: { type: "string", enum: ISSUE_RULES.map((rule) => rule.tag).concat(["general"]) }
      },
      pnr: { type: ["string", "null"] },
      trainNumber: { type: ["string", "null"] },
      coach: { type: ["string", "null"] },
      berth: { type: ["string", "null"] }
    },
    required: ["issueTags", "pnr", "trainNumber", "coach", "berth"],
    additionalProperties: false
  };
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: getEnv("GROQ_MODEL") || "openai/gpt-oss-20b",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: "Extract Indian railway complaint fields. Return only schema-valid JSON. Use null when unknown."
        },
        {
          role: "user",
          content: JSON.stringify({
            transcript: input.transcript || "",
            language: input.language || "en",
            pnr: input.pnr || null,
            trainNumber: input.trainNumber || input.train || null,
            coach: input.coach || null,
            berth: input.berth || null
          })
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "railsense_complaint_extract", strict: true, schema }
      }
    })
  });
  if (!response.ok) throw new Error(`Groq extraction failed: ${response.status}`);
  const data = await response.json();
  return JSON.parse(data.choices?.[0]?.message?.content || "{}");
}

async function extractWithGroqOrRules(input) {
  const ruleBased = extractComplaintFields(input);
  let ai = {};
  try {
    ai = await callGroqExtractor(input);
  } catch (_) {
    ai = {};
  }
  const tags = Array.isArray(ai.issueTags) && ai.issueTags.length ? ai.issueTags : ruleBased.issueTags;
  return {
    issueTags: tags,
    issueLabels: tagsToLabels(tags),
    pnr: input.pnr || ai.pnr || ruleBased.pnr || "",
    trainNumber: input.trainNumber || input.train || ai.trainNumber || ruleBased.trainNumber || "",
    coach: input.coach || ai.coach || ruleBased.coach || "",
    berth: input.berth || ai.berth || ruleBased.berth || ""
  };
}

async function extractPnrWithNvidia(imageBase64) {
  const key = requireEnv("NVIDIA_NIM_API_KEY");
  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: getEnv("NVIDIA_NIM_VISION_MODEL") || "meta/llama-3.2-11b-vision-instruct",
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Read this railway ticket image. Return JSON with pnr as 10 digits or null, confidence 0-1." },
            { type: "image_url", image_url: { url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }
      ],
      response_format: { type: "json_object" }
    })
  });
  if (!response.ok) throw new Error(`NVIDIA NIM OCR failed: ${response.status}`);
  const data = await response.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
  return {
    pnr: parsed.pnr && /^\d{10}$/.test(String(parsed.pnr)) ? String(parsed.pnr) : null,
    confidence: Number(parsed.confidence || 0),
    provider: "nvidia_nim",
    needsConfirmation: Number(parsed.confidence || 0) < 0.8
  };
}

function languageCode(language) {
  const codes = { en: "en-IN", hi: "hi-IN", kn: "kn-IN", te: "te-IN", ta: "ta-IN", bn: "bn-IN", ml: "ml-IN", mr: "mr-IN", gu: "gu-IN", pa: "pa-IN", od: "od-IN" };
  const raw = String(language || "en").trim().replace("_", "-");
  const short = raw.slice(0, 2).toLowerCase();
  return codes[short] || "en-IN";
}

function base64ToBlob(base64, mimeType) {
  const clean = base64.includes(",") ? base64.split(",").pop() : base64;
  const bytes = Buffer.from(clean, "base64");
  return new Blob([bytes], { type: mimeType });
}

async function sarvamSpeechToText(audioBase64, language) {
  const key = requireEnv("SARVAM_API_KEY");
  const form = new FormData();
  form.append("file", base64ToBlob(audioBase64, "audio/webm"), "audio.webm");
  form.append("model", "saaras:v4");
  form.append("mode", "transcribe");
  form.append("language_code", languageCode(language));
  const response = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST",
    headers: { "api-subscription-key": key },
    body: form
  });
  if (!response.ok) throw new Error(`Sarvam STT failed: ${response.status}`);
  return response.json();
}

async function sarvamTextToSpeech(text, language) {
  const key = requireEnv("SARVAM_API_KEY");
  const response = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "api-subscription-key": key,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      text,
      language_code: languageCode(language),
      model: "bulbul:v3",
      speaker: getEnv("SARVAM_TTS_SPEAKER") || "shubh"
    })
  });
  if (!response.ok) throw new Error(`Sarvam TTS failed: ${response.status}`);
  return response.json();
}

module.exports = {
  DEFAULT_PNR_DIRECTORY,
  callGroqExtractor,
  computeSeverity,
  extractComplaintFields,
  extractPnrWithNvidia,
  extractWithGroqOrRules,
  generateComplaintId,
  getEnv,
  jsonResponse,
  languageCode,
  lookupSeedPnr,
  parseBody,
  requireEnv,
  sarvamSpeechToText,
  sarvamTextToSpeech,
  toClientComplaint,
  validatePnr
};
