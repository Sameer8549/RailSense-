// Client and functions live on the same Catalyst origin in every deployed
// environment. Keeping the fallback here prevents a missing build-time env
// value from turning submission into a client-side dead end.
const BASE_URL = import.meta.env.VITE_CATALYST_FUNCTION_BASE_URL || `${window.location.origin}/server`;

async function postFunction(name, body) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, "")}/${name}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || data.error || `${name} failed`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function submitComplaint(payload) {
  const data = await postFunction("submitComplaint", payload);
  return data.complaint || data;
}

export async function analyzeComplaint(payload) {
  return postFunction("analyzeComplaint", payload);
}

export async function extractPnrFromPhoto(pnrPhotoBase64) {
  return postFunction("extractPnrFromPhoto", { pnrPhotoBase64 });
}

export async function speechToText(audioBase64, language) {
  return postFunction("speechToText", { audioBase64, language });
}

export async function trackComplaint(complaintId) {
  const data = await postFunction("trackComplaint", { complaintId });
  return data.complaint || data;
}
