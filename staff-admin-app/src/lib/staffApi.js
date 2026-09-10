const FUNCTION_BASE_URL =
  import.meta.env.VITE_CATALYST_FUNCTION_BASE_URL ||
  "https://railsense-60074625517.development.catalystserverless.in/server";

export async function callStaffApi(payload) {
  const response = await fetch(`${FUNCTION_BASE_URL}/staffApi/`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || data.error || "Staff API request failed");
    error.status = response.status;
    throw error;
  }
  return data;
}

export function loginStaff(staffId, pin) {
  return callStaffApi({ op: "loginStaff", staffId, pin });
}

export function getUpdatesSince(lastCheckedTimestamp, includeAll = false) {
  return callStaffApi({ op: "getUpdatesSince", lastCheckedTimestamp, includeAll });
}

export function submitStaffAction(payload) {
  return callStaffApi(payload);
}
