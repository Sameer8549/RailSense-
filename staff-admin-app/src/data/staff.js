/**
 * Staff directory — role is authoritative here.
 * Login matches staffId + pin; role/name come from this record.
 * Demo credentials: TTE-104 / 0000  and  ADM-003 / 0000
 */
export const STAFF_DIRECTORY = [
  { id: "TTE-101", pin: "1234", name: "Ramesh Kumar",  role: "tte",   train: "12951", coach: null },
  { id: "TTE-102", pin: "5678", name: "Priya Sharma",  role: "tte",   train: "12952", coach: null },
  { id: "TTE-103", pin: "4321", name: "Arjun Menon",   role: "tte",   train: "12953", coach: null },
  { id: "TTE-104", pin: "0000", name: "Demo TTE",      role: "tte",   train: null,    coach: null },
  { id: "ADM-001", pin: "9999", name: "Vikram Singh",  role: "admin", train: null,    coach: null },
  { id: "ADM-002", pin: "1111", name: "Sunita Reddy",  role: "admin", train: null,    coach: null },
  { id: "ADM-003", pin: "0000", name: "Demo Admin",    role: "admin", train: null,    coach: null },
];

export function authenticate(staffId, pin) {
  const staff = STAFF_DIRECTORY.find(
    (s) => s.id.toLowerCase() === staffId.trim().toLowerCase() && s.pin === pin.trim()
  );
  return staff || null;
}
