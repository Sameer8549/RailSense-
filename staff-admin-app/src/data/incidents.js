// Issue type metadata
export const ISSUE_TYPES = {
  ac:          { label: "AC / Cooling",        color: "#3b82f6" },
  cleanliness: { label: "Cleanliness",         color: "#8b5cf6" },
  electrical:  { label: "Electrical",          color: "#f59e0b" },
  pantry:      { label: "Pantry / Catering",   color: "#f97316" },
  charging:    { label: "Charging Point",      color: "#06b6d4" },
  water:       { label: "Water Supply",        color: "#0ea5e9" },
  noise:       { label: "Noise/Disturbance",   color: "#6b7280" },
  overcharge:  { label: "Overcharging",        color: "#ef4444" },
  safety:      { label: "Safety / Security",   color: "#dc2626" },
  toilet:      { label: "Toilet",              color: "#a16207" },
};

export const TRAIN_ROUTES = {
  "12951": "Western Corridor",
  "12952": "Western Corridor",
  "12953": "Western Corridor",
  "12554": "Northern Corridor",
  "12303": "Eastern Corridor",
  "12956": "Western Corridor",
};

export const TRAIN_COMPOSITIONS = {
  // Generic composition used for most LHB trains
  default: ["EOG", "H1", "A1", "A2", "B1", "B2", "B3", "B4", "PC", "S1", "S2", "S3", "S4", "S5", "S6", "D1", "D2", "EOG"],
  "12554": ["EOG", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "D1", "D2", "EOG"], // Chair car layout
  "12303": ["EOG", "H1", "A1", "A2", "B1", "B2", "B3", "PC", "SL1", "SL2", "SL3", "SL4", "SL5", "EOG"],
};

// Gets coach class from coach ID (e.g. "B2" -> "AC 3-Tier", "S5" -> "Sleeper")
export function getCoachClass(coach) {
  if (coach.startsWith("H")) return "AC 1st Class";
  if (coach.startsWith("A")) return "AC 2-Tier";
  if (coach.startsWith("B")) return "AC 3-Tier";
  if (coach.startsWith("S") && !coach.startsWith("SL")) return "Sleeper";
  if (coach.startsWith("SL")) return "Sleeper";
  if (coach.startsWith("C")) return "AC Chair Car";
  if (coach.startsWith("D")) return "General 2S";
  if (coach === "PC") return "Pantry Car";
  if (coach === "EOG") return "Generator Car";
  return "Unknown";
}

// Severity score weights
export function severityScore(incident) {
  const base = { high: 100, medium: 50, low: 20 }[incident.severity] || 0;
  return base + incident.recurrenceCount * 12;
}

// Full incident list — star case is RS-2026-00042 ("6th complaint")
export const INCIDENTS = [
  {
    id: "RS-2026-00042",
    train: "12951", trainName: "Mumbai Rajdhani",
    coach: "B2", berth: null,
    issueTypes: ["ac", "cleanliness"],
    summary: "AC fully non-functional, coach extremely dirty. 6th complaint on this coach in 3 weeks.",
    severity: "high",
    recurrenceCount: 6, recurrencePeriod: "3 weeks",
    filedAt: "2026-09-09T08:14:00Z",
    status: "open", currentStatus: "underReview",
    pnr: "4521987630",
    evidence: {
      hasPhoto: true, hasAudio: true, confidence: "high",
      images: [
        {
          url: "/evidence/broken_ac.jpg",
          caption: "Coach B2 — AC unit (passenger photo)",
          aiDetections: [
            { x: 12, y: 8,  w: 38, h: 42, label: "AC unit — non-functional",  confidence: 0.94 },
            { x: 55, y: 60, w: 40, h: 35, label: "Cleanliness violation",      confidence: 0.87 },
          ],
        },
        {
          url: "/evidence/dirty_berth.jpg",
          caption: "Coach B2 — berth area",
          aiDetections: [
            { x: 20, y: 30, w: 60, h: 50, label: "Cleanliness issue", confidence: 0.91 },
          ],
        },
      ],
      audioUrl: "demo",
      afterPhotoUrl: "/evidence/clean_berth.jpg",
    },
    actions: [],
    assignee: null,
    aiSummary: "Persistent AC unit failure in coach B2 over 6 incidents in 21 days. Pattern suggests hardware fault — temporary repairs (Aug 29) did not hold.",
    rootCause: "Probable compressor unit failure — same fault pattern as RS-2026-00028. Three temporary repairs have failed to resolve the underlying issue.",
    recommendedAction: "Mandatory inspection before next departure. Replace AC compressor unit. Maintenance priority: CRITICAL.",
    recurrenceForecast: { probability: 0.94, nextOccurrenceDays: 2, basis: "6 incidents in 21 days, exponentially increasing frequency — 99% probability of failure on next trip without depot intervention." },
    relatedIncidents: ["RS-2026-00035","RS-2026-00028","RS-2026-00021","RS-2026-00014","RS-2026-00007"],
    severityFactors: [
      { factor: "Recurrence (6 in 21 days)", weight: "+72", impact: "critical" },
      { factor: "Severity level: High",      weight: "+100", impact: "high" },
      { factor: "Failed prior resolutions",  weight: "+35", impact: "high" },
      { factor: "Coach occupancy ~90%",      weight: "+18", impact: "medium" },
    ],
    resolvedAttempts: [
      { date: "2026-08-29", by: "TTE Arjun Menon", note: "Reported to housekeeping — temporary fix applied." },
      { date: "2026-09-02", by: "ADM-001 Vikram Singh", note: "Maintenance notified — compressor checked." },
    ],
    resolutionHeld: false,
    history: [
      { date: "2026-08-18", severity: "low",    id: "RS-2026-00007", summary: "AC intermittent" },
      { date: "2026-08-22", severity: "medium", id: "RS-2026-00014", summary: "AC fully off — coach hot" },
      { date: "2026-08-29", severity: "medium", id: "RS-2026-00021", summary: "AC failure + cleanliness" },
      { date: "2026-09-02", severity: "high",   id: "RS-2026-00028", summary: "Repeated AC failure; passenger distress" },
      { date: "2026-09-06", severity: "high",   id: "RS-2026-00035", summary: "AC failure — 3rd consecutive trip" },
      { date: "2026-09-09", severity: "high",   id: "RS-2026-00042", summary: "AC + cleanliness — escalation required" },
    ],
  },
  {
    id: "RS-2026-00041",
    train: "12952", trainName: "Mumbai Rajdhani (Return)",
    coach: "S5", berth: "34",
    issueTypes: ["overcharge"],
    summary: "Pantry staff charged ₹250 for water bottle priced ₹20. Passenger has receipt photo.",
    severity: "high",
    recurrenceCount: 1, recurrencePeriod: null,
    filedAt: "2026-09-09T07:55:00Z",
    status: "open", currentStatus: "acknowledged",
    pnr: "7634512980",
    evidence: {
      hasPhoto: true, hasAudio: false, confidence: "high",
      images: [
        {
          url: "https://images.unsplash.com/photo-1554162061-0d33e5069a53?auto=format&fit=crop&q=80&w=800",
          caption: "Pantry receipt — passenger photo",
          aiDetections: [
            { x: 30, y: 15, w: 40, h: 30, label: "Receipt — overcharge detected", confidence: 0.96 },
            { x: 30, y: 50, w: 40, h: 20, label: "Amount: ₹250 (MRP ₹20)",        confidence: 0.93 },
          ],
        },
      ],
    },
    actions: [{ by: "System", at: "2026-09-09T07:56:00Z", note: "Auto-acknowledged" }],
    assignee: "TTE-102 Priya Sharma",
    aiSummary: "Overcharging by pantry staff — photo evidence of receipt included. Requires TTE on-site verification.",
    rootCause: null,
    recommendedAction: "TTE to verify with pantry car record and issue caution notice. Log caterer violation.",
    recurrenceForecast: null,
    relatedIncidents: [],
    severityFactors: [
      { factor: "Severity: High",          weight: "+100", impact: "high" },
      { factor: "Strong evidence (photo)", weight: "+15",  impact: "medium" },
    ],
    resolvedAttempts: [],
    resolutionHeld: null,
    history: [],
    policyMatch: { mrpBottle: "₹20", chargedAmount: "₹250", overchargeAmount: "₹230", category: "Overcharging §7.2(b)" },
  },
  {
    id: "RS-2026-00040",
    train: "12953", trainName: "Paschim Express",
    coach: "A1", berth: null,
    issueTypes: ["toilet", "water"],
    summary: "Toilet blocked, no water in washroom for 4+ hours.",
    severity: "high",
    recurrenceCount: 3, recurrencePeriod: "2 weeks",
    filedAt: "2026-09-09T06:30:00Z",
    status: "open", currentStatus: "underReview",
    pnr: null,
    evidence: {
      hasPhoto: false, hasAudio: true, confidence: "medium",
      images: [],
      audioUrl: "demo",
    },
    actions: [{ by: "TTE-103 Arjun Menon", at: "2026-09-09T07:10:00Z", note: "Forwarded to on-board housekeeping." }],
    assignee: "TTE-103 Arjun Menon",
    aiSummary: "3rd complaint on A1 coach 12953 in 2 weeks — blockage recurring.",
    rootCause: "Structural blockage — temporary clearing insufficient.",
    recommendedAction: "Schedule depot maintenance for toilet system before next run.",
    recurrenceForecast: { probability: 0.78, nextOccurrenceDays: 4, basis: "3 incidents in 2 weeks with prior temporary fixes failing." },
    relatedIncidents: [],
    severityFactors: [
      { factor: "Severity: High",                weight: "+100", impact: "high" },
      { factor: "Recurrence (3 in 2 weeks)",     weight: "+36",  impact: "high" },
      { factor: "Failed prior resolution",       weight: "+35",  impact: "high" },
    ],
    resolvedAttempts: [
      { date: "2026-09-01", by: "TTE-103 Arjun Menon", note: "Housekeeping called — partial fix." },
    ],
    resolutionHeld: false,
    history: [
      { date: "2026-08-26", severity: "medium", id: "RS-2026-00030", summary: "Toilet slow drain" },
      { date: "2026-09-01", severity: "medium", id: "RS-2026-00036", summary: "Toilet blocked — partial fix" },
      { date: "2026-09-09", severity: "high",   id: "RS-2026-00040", summary: "Toilet blocked + no water" },
    ],
  },
  {
    id: "RS-2026-00039",
    train: "12554", trainName: "Himalayan Queen",
    coach: "C3", berth: "12",
    issueTypes: ["electrical", "charging"],
    summary: "All charging points dead in C3 — 2nd occurrence this month.",
    severity: "medium",
    recurrenceCount: 2, recurrencePeriod: "1 month",
    filedAt: "2026-09-09T05:20:00Z",
    status: "open", currentStatus: "acknowledged",
    pnr: "3310987562",
    evidence: { hasPhoto: false, hasAudio: false, confidence: "low" },
    actions: [],
    assignee: null,
    aiSummary: "Electrical panel fault — 2nd occurrence on same coach in a month.",
    rootCause: null,
    recommendedAction: "Electrical check at next halt.",
    recurrenceForecast: { probability: 0.55, nextOccurrenceDays: 14, basis: "2 incidents in 30 days — moderate recurrence risk." },
    relatedIncidents: [],
    severityFactors: [
      { factor: "Severity: Medium",         weight: "+50", impact: "medium" },
      { factor: "Recurrence (2 in 1 mo)",   weight: "+24", impact: "medium" },
    ],
    resolvedAttempts: [],
    resolutionHeld: null,
    history: [
      { date: "2026-08-10", severity: "low",    id: "RS-2026-00018", summary: "Some charging points not working" },
      { date: "2026-09-09", severity: "medium", id: "RS-2026-00039", summary: "All charging points dead" },
    ],
  },
  {
    id: "RS-2026-00038",
    train: "12951", trainName: "Mumbai Rajdhani",
    coach: "D1", berth: null,
    issueTypes: ["pantry"],
    summary: "Food served cold and stale — photo evidence attached.",
    severity: "medium",
    recurrenceCount: 1, recurrencePeriod: null,
    filedAt: "2026-09-09T04:45:00Z",
    status: "open", currentStatus: "filed",
    pnr: null,
    evidence: { hasPhoto: true, hasAudio: false, confidence: "medium" },
    actions: [],
    assignee: null,
    aiSummary: "Single complaint, pantry quality issue. Photo evidence attached.",
    rootCause: null,
    recommendedAction: "TTE to inspect pantry car and log caterer note.",
    recurrenceForecast: null,
    relatedIncidents: [],
    severityFactors: [{ factor: "Severity: Medium", weight: "+50", impact: "medium" }],
    resolvedAttempts: [], resolutionHeld: null, history: [],
  },
  {
    id: "RS-2026-00037",
    train: "12303", trainName: "Poorva Express",
    coach: "SL3", berth: "54",
    issueTypes: ["noise", "safety"],
    summary: "Unruly passenger disturbing co-passengers. Audio evidence recorded.",
    severity: "medium",
    recurrenceCount: 1, recurrencePeriod: null,
    filedAt: "2026-09-09T03:10:00Z",
    status: "open", currentStatus: "underReview",
    pnr: "8821047532",
    evidence: {
      hasPhoto: false, hasAudio: true, confidence: "medium",
      images: [],
      audioUrl: "demo",
    },
    actions: [{ by: "TTE-101 Ramesh Kumar", at: "2026-09-09T03:25:00Z", note: "Verbal warning issued." }],
    assignee: "TTE-101 Ramesh Kumar",
    aiSummary: "Disturbance complaint — TTE has taken initial action.",
    rootCause: null,
    recommendedAction: "Monitor — escalate to RPF if required.",
    recurrenceForecast: null,
    relatedIncidents: [],
    severityFactors: [
      { factor: "Severity: Medium",        weight: "+50", impact: "medium" },
      { factor: "Safety component",        weight: "+20", impact: "medium" },
    ],
    resolvedAttempts: [], resolutionHeld: null, history: [],
  },
  {
    id: "RS-2026-00036",
    train: "12956", trainName: "Jaipur Express",
    coach: "B4", berth: null,
    issueTypes: ["cleanliness"],
    summary: "Coach dirty — leftover food, floor not cleaned since boarding.",
    severity: "low",
    recurrenceCount: 1, recurrencePeriod: null,
    filedAt: "2026-09-09T02:00:00Z",
    status: "open", currentStatus: "resolved",
    pnr: null,
    evidence: { hasPhoto: false, hasAudio: false, confidence: "low" },
    actions: [{ by: "TTE-101 Ramesh Kumar", at: "2026-09-09T02:45:00Z", note: "Housekeeping dispatched — cleaned." }],
    assignee: "TTE-101 Ramesh Kumar",
    aiSummary: "Resolved — housekeeping addressed within 45 minutes.",
    rootCause: null, recommendedAction: null,
    recurrenceForecast: null, relatedIncidents: [],
    severityFactors: [{ factor: "Severity: Low", weight: "+20", impact: "low" }],
    resolvedAttempts: [], resolutionHeld: true, history: [],
  },
  ...([{"id":"RS-MOCK-0","train":"12953","coach":"PC","issueTypes":["cleanliness"],"summary":"Mock historical incident 0","severity":"high","recurrenceCount":1,"filedAt":"2026-08-02T04:45:29.641Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-1","train":"12951","coach":"PC","issueTypes":["water","cleanliness"],"summary":"Mock historical incident 1","severity":"high","recurrenceCount":1,"filedAt":"2026-07-15T04:45:29.658Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-2","train":"12951","coach":"B2","issueTypes":["cleanliness"],"summary":"Mock historical incident 2","severity":"low","recurrenceCount":1,"filedAt":"2026-09-07T04:45:29.658Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-3","train":"12303","coach":"A1","issueTypes":["toilet"],"summary":"Mock historical incident 3","severity":"high","recurrenceCount":1,"filedAt":"2026-08-01T04:45:29.658Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-4","train":"12303","coach":"S5","issueTypes":["toilet"],"summary":"Mock historical incident 4","severity":"medium","recurrenceCount":1,"filedAt":"2026-07-16T04:45:29.658Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-5","train":"12952","coach":"S1","issueTypes":["ac"],"summary":"Mock historical incident 5","severity":"medium","recurrenceCount":1,"filedAt":"2026-07-24T04:45:29.658Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-6","train":"12554","coach":"C3","issueTypes":["water","cleanliness"],"summary":"Mock historical incident 6","severity":"medium","recurrenceCount":1,"filedAt":"2026-08-06T04:45:29.658Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-7","train":"12953","coach":"C3","issueTypes":["water","cleanliness"],"summary":"Mock historical incident 7","severity":"medium","recurrenceCount":1,"filedAt":"2026-08-16T04:45:29.658Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-8","train":"12956","coach":"B2","issueTypes":["cleanliness"],"summary":"Mock historical incident 8","severity":"medium","recurrenceCount":1,"filedAt":"2026-07-24T04:45:29.658Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-9","train":"12303","coach":"A1","issueTypes":["water","cleanliness"],"summary":"Mock historical incident 9","severity":"medium","recurrenceCount":1,"filedAt":"2026-08-09T04:45:29.658Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-10","train":"12951","coach":"A1","issueTypes":["toilet"],"summary":"Mock historical incident 10","severity":"medium","recurrenceCount":1,"filedAt":"2026-08-23T04:45:29.658Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-11","train":"12303","coach":"C3","issueTypes":["ac"],"summary":"Mock historical incident 11","severity":"medium","recurrenceCount":1,"filedAt":"2026-07-24T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-12","train":"12554","coach":"B2","issueTypes":["cleanliness"],"summary":"Mock historical incident 12","severity":"high","recurrenceCount":1,"filedAt":"2026-07-20T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-13","train":"12952","coach":"A1","issueTypes":["cleanliness"],"summary":"Mock historical incident 13","severity":"medium","recurrenceCount":1,"filedAt":"2026-08-21T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-14","train":"12953","coach":"C3","issueTypes":["water","cleanliness"],"summary":"Mock historical incident 14","severity":"low","recurrenceCount":1,"filedAt":"2026-07-11T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-15","train":"12952","coach":"B1","issueTypes":["toilet"],"summary":"Mock historical incident 15","severity":"high","recurrenceCount":1,"filedAt":"2026-08-15T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-16","train":"12953","coach":"PC","issueTypes":["pantry"],"summary":"Mock historical incident 16","severity":"low","recurrenceCount":1,"filedAt":"2026-09-07T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-17","train":"12952","coach":"PC","issueTypes":["water","cleanliness"],"summary":"Mock historical incident 17","severity":"medium","recurrenceCount":1,"filedAt":"2026-07-31T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-18","train":"12554","coach":"PC","issueTypes":["ac"],"summary":"Mock historical incident 18","severity":"medium","recurrenceCount":1,"filedAt":"2026-09-07T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-19","train":"12554","coach":"C3","issueTypes":["pantry"],"summary":"Mock historical incident 19","severity":"low","recurrenceCount":1,"filedAt":"2026-09-07T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-20","train":"12956","coach":"PC","issueTypes":["toilet"],"summary":"Mock historical incident 20","severity":"medium","recurrenceCount":1,"filedAt":"2026-08-18T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-21","train":"12956","coach":"B1","issueTypes":["pantry"],"summary":"Mock historical incident 21","severity":"low","recurrenceCount":1,"filedAt":"2026-07-11T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-22","train":"12956","coach":"S1","issueTypes":["toilet"],"summary":"Mock historical incident 22","severity":"medium","recurrenceCount":1,"filedAt":"2026-08-09T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-23","train":"12952","coach":"S5","issueTypes":["water","cleanliness"],"summary":"Mock historical incident 23","severity":"medium","recurrenceCount":1,"filedAt":"2026-07-23T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-24","train":"12554","coach":"S1","issueTypes":["toilet"],"summary":"Mock historical incident 24","severity":"low","recurrenceCount":1,"filedAt":"2026-07-27T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-25","train":"12951","coach":"PC","issueTypes":["ac"],"summary":"Mock historical incident 25","severity":"medium","recurrenceCount":1,"filedAt":"2026-07-21T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-26","train":"12303","coach":"B1","issueTypes":["water","cleanliness"],"summary":"Mock historical incident 26","severity":"low","recurrenceCount":1,"filedAt":"2026-07-30T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-27","train":"12951","coach":"B1","issueTypes":["toilet"],"summary":"Mock historical incident 27","severity":"low","recurrenceCount":1,"filedAt":"2026-09-07T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-28","train":"12554","coach":"B2","issueTypes":["cleanliness"],"summary":"Mock historical incident 28","severity":"low","recurrenceCount":1,"filedAt":"2026-08-09T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-29","train":"12951","coach":"S5","issueTypes":["water","cleanliness"],"summary":"Mock historical incident 29","severity":"low","recurrenceCount":1,"filedAt":"2026-08-15T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-30","train":"12956","coach":"S1","issueTypes":["ac"],"summary":"Mock historical incident 30","severity":"high","recurrenceCount":1,"filedAt":"2026-08-07T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-31","train":"12952","coach":"B1","issueTypes":["cleanliness"],"summary":"Mock historical incident 31","severity":"medium","recurrenceCount":1,"filedAt":"2026-07-21T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-32","train":"12303","coach":"S5","issueTypes":["pantry"],"summary":"Mock historical incident 32","severity":"low","recurrenceCount":1,"filedAt":"2026-08-28T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-33","train":"12554","coach":"B1","issueTypes":["cleanliness"],"summary":"Mock historical incident 33","severity":"low","recurrenceCount":1,"filedAt":"2026-08-13T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-34","train":"12303","coach":"S5","issueTypes":["toilet"],"summary":"Mock historical incident 34","severity":"low","recurrenceCount":1,"filedAt":"2026-08-15T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-35","train":"12554","coach":"B2","issueTypes":["cleanliness"],"summary":"Mock historical incident 35","severity":"high","recurrenceCount":1,"filedAt":"2026-08-12T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-36","train":"12554","coach":"S5","issueTypes":["cleanliness"],"summary":"Mock historical incident 36","severity":"low","recurrenceCount":1,"filedAt":"2026-07-19T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-37","train":"12303","coach":"B1","issueTypes":["cleanliness"],"summary":"Mock historical incident 37","severity":"medium","recurrenceCount":1,"filedAt":"2026-07-21T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-38","train":"12951","coach":"B2","issueTypes":["toilet"],"summary":"Mock historical incident 38","severity":"medium","recurrenceCount":1,"filedAt":"2026-08-17T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]},{"id":"RS-MOCK-39","train":"12952","coach":"S5","issueTypes":["water","cleanliness"],"summary":"Mock historical incident 39","severity":"low","recurrenceCount":1,"filedAt":"2026-08-20T04:45:29.659Z","status":"resolved","currentStatus":"resolved","evidence":{"hasPhoto":false,"hasAudio":false},"actions":[],"history":[]}])
];

// Dashboard stats derived from incidents
export function getDashboardStats(incidents) {
  const open = incidents.filter(i => i.status !== "resolved" && i.currentStatus !== "resolved");
  return {
    totalOpen: open.length,
    highSeverity: open.filter(i => i.severity === "high").length,
    pendingEscalation: open.filter(i => i.currentStatus === "underReview" && !i.assignee).length,
    resolvedToday: incidents.filter(i => i.currentStatus === "resolved").length,
    severityBreakdown: [
      { name: "High",   value: incidents.filter(i => i.severity === "high").length,   fill: "hsl(1 82% 50%)" },
      { name: "Medium", value: incidents.filter(i => i.severity === "medium").length, fill: "hsl(32 95% 48%)" },
      { name: "Low",    value: incidents.filter(i => i.severity === "low").length,    fill: "hsl(148 56% 40%)" },
    ],
  };
}

// Hotspot coaches for fleet overview
export function getHotspots(incidents) {
  const map = {};
  incidents.forEach(inc => {
    const key = `${inc.train}/${inc.coach}`;
    if (!map[key]) map[key] = { train: inc.train, trainName: inc.trainName, coach: inc.coach, count: 0, maxSeverity: "low", lastDate: "" };
    map[key].count++;
    if (inc.severity === "high") map[key].maxSeverity = "high";
    else if (inc.severity === "medium" && map[key].maxSeverity !== "high") map[key].maxSeverity = "medium";
    if (!map[key].lastDate || inc.filedAt > map[key].lastDate) map[key].lastDate = inc.filedAt;
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
}

// Sparkline data generator for a specific train over N days
export function getTrainSparkline(trainNumber, incidents, days = 14) {
  const data = Array(days).fill(0);
  const now = Date.now();
  
  // Create a timeline from past incidents on this train
  incidents.forEach(inc => {
    if (inc.train === trainNumber) {
      // Current active incident
      const diff = Math.floor((now - new Date(inc.filedAt).getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff < days) data[days - 1 - diff]++;
      
      // History incidents
      inc.history?.forEach(h => {
        const hDiff = Math.floor((now - new Date(h.date).getTime()) / (1000 * 60 * 60 * 24));
        if (hDiff >= 0 && hDiff < days) data[days - 1 - hDiff]++;
      });
    }
  });

  return data;
}

// Compute a 0-100 blended risk score for a train
export function getTrainRiskScore(trainNumber, incidents) {
  const trainIncs = incidents.filter(i => i.train === trainNumber && i.status !== "resolved");
  if (trainIncs.length === 0) return 0;
  
  let score = 0;
  trainIncs.forEach(i => {
    score += { high: 25, medium: 10, low: 5 }[i.severity] || 0;
    score += (i.recurrenceCount > 1 ? i.recurrenceCount * 12 : 0);
  });
  
  // Factor in trend (recent 7 days vs previous 7 days)
  const spark = getTrainSparkline(trainNumber, incidents, 14);
  const recent = spark.slice(7).reduce((a,b)=>a+b, 0);
  const past = spark.slice(0,7).reduce((a,b)=>a+b, 0);
  if (recent > past) score += 20; // Trending worse
  
  return Math.min(100, score);
}

// Heatmap Data Generator
export function getHeatmapData(incidents, groupBy = "coach", days = 30) {
  const now = Date.now();
  const matrix = {}; // { rowKey: { colKey: count } }
  
  // Initialize rows (trains)
  const uniqueTrains = [...new Set(incidents.map(i => i.train))];
  uniqueTrains.forEach(t => matrix[t] = {});

  incidents.forEach(inc => {
    // Filter by time
    const diff = Math.floor((now - new Date(inc.filedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (diff > days) return; // Out of range

    const row = inc.train;
    const col = groupBy === "class" ? getCoachClass(inc.coach) : inc.coach;
    
    if (!matrix[row][col]) matrix[row][col] = { count: 0, topSeverity: 'low', lastIssueType: '' };
    
    const cell = matrix[row][col];
    cell.count++;
    if (inc.severity === "high") cell.topSeverity = "high";
    else if (inc.severity === "medium" && cell.topSeverity === "low") cell.topSeverity = "medium";
    if (inc.issueTypes?.[0]) cell.lastIssueType = inc.issueTypes[0];
  });
  
  // Format for Recharts or generic grid
  const formattedRows = Object.keys(matrix).map(train => {
    const route = TRAIN_ROUTES[train] || "Other Route";
    const trainName = incidents.find(i => i.train === train)?.trainName || "";
    return {
      train, trainName, route,
      cells: matrix[train]
    };
  });
  
  return formattedRows;
}

// Applies Dashboard filters
export function getFilteredIncidents(incidents, filter) {
  const now = Date.now();
  return incidents.filter(inc => {
    // 1. Date Range
    if (filter.dateRange !== "all") {
      const diffDays = Math.floor((now - new Date(inc.filedAt).getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > filter.dateRange) return false;
    }
    // 2. Train
    if (filter.train !== "all" && inc.train !== filter.train) return false;
    // 3. Route
    if (filter.route !== "all" && TRAIN_ROUTES[inc.train] !== filter.route) return false;
    // 4. Severity
    if (filter.severity !== "all" && inc.severity !== filter.severity) return false;
    // 5. Issue Type
    if (filter.issueType !== "all" && !inc.issueTypes.includes(filter.issueType)) return false;
    
    return true;
  });
}

// Compute dashboard stats with Period-over-Period deltas
export function getDashboardStatsWithDeltas(incidents, filter) {
  const currentIncidents = getFilteredIncidents(incidents, filter);
  
  // Calculate previous period for comparison
  let previousIncidents = [];
  if (filter.dateRange !== "all") {
    const now = Date.now();
    const periodMs = filter.dateRange * 24 * 60 * 60 * 1000;
    previousIncidents = incidents.filter(inc => {
      const t = new Date(inc.filedAt).getTime();
      return t >= (now - periodMs * 2) && t < (now - periodMs); // The N days before the current N days
    });
    // apply other filters to previous
    previousIncidents = getFilteredIncidents(previousIncidents, { ...filter, dateRange: "all" });
  }
  
  const currentStats = getDashboardStats(currentIncidents);
  const prevStats = getDashboardStats(previousIncidents);
  
  const calcDelta = (curr, prev) => {
    if (prev === 0 && curr === 0) return 0;
    if (prev === 0) return 100; // 100% increase if from 0 to something
    return Math.round(((curr - prev) / prev) * 100);
  };

  return {
    ...currentStats,
    deltas: {
      totalOpen: calcDelta(currentStats.totalOpen, prevStats.totalOpen),
      highSeverity: calcDelta(currentStats.highSeverity, prevStats.highSeverity),
      resolvedToday: calcDelta(currentStats.resolvedToday, prevStats.resolvedToday), // "resolvedToday" is actually total resolved in period here based on getDashboardStats, but kept name for compatibility
    },
    filteredIncidents: currentIncidents,
    previousIncidents: previousIncidents,
  };
}

// Generate AI Insight Narrative
export function generateInsightNarrative(statsWithDeltas, filter) {
  const { currentStats, deltas, filteredIncidents } = statsWithDeltas;
  if (filteredIncidents.length === 0) return "No incidents found for the current filter criteria. The fleet is operating nominally.";
  
  const totalOpenDelta = deltas.totalOpen;
  const direction = totalOpenDelta > 0 ? "up" : totalOpenDelta < 0 ? "down" : "flat";
  const absDelta = Math.abs(totalOpenDelta);
  
  // Find top issue type
  const issueCounts = {};
  filteredIncidents.forEach(inc => {
    inc.issueTypes.forEach(type => {
      issueCounts[type] = (issueCounts[type] || 0) + 1;
    });
  });
  const topIssueKey = Object.keys(issueCounts).sort((a,b) => issueCounts[b] - issueCounts[a])[0];
  const topIssue = topIssueKey ? ISSUE_TYPES[topIssueKey]?.label || topIssueKey : "various faults";

  if (filter.dateRange === "all") {
    return `Lifetime incidents total ${filteredIncidents.length}, with ${topIssue} representing the primary ongoing operational challenge.`;
  }
  
  if (direction === "flat") {
    return `Incident volume remains flat compared to the previous period. ${topIssue} continues to be the dominant issue reported by passengers.`;
  }
  
  return `Incident volume is ${direction} ${absDelta}% vs. the previous period, driven primarily by ${topIssue} complaints.`;
}

// Generate Volume Trend Data (Volume over last N days + optional 3 day forecast)
export function getVolumeTrendData(incidents, filter, days = 14, forecast = true) {
  // Use all history of the currently filtered trains/routes/issue types, but ignore the dateRange filter for the X-axis
  const baseFilter = { ...filter, dateRange: "all" };
  const relevantIncidents = getFilteredIncidents(incidents, baseFilter);
  
  const now = new Date();
  now.setHours(0,0,0,0); // start of today
  const data = [];
  
  // Generate past days
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Count incidents on this day
    const count = relevantIncidents.filter(inc => {
      const incDate = new Date(inc.filedAt);
      incDate.setHours(0,0,0,0);
      return incDate.getTime() === d.getTime();
    }).length;
    
    data.push({ date: dateStr, actual: count, projected: null });
  }
  
  if (forecast && days >= 3) {
    // Simple 3-day moving average for the next 3 days
    let last3 = data.slice(-3).map(d => d.actual);
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const avg = Math.round(last3.reduce((a,b)=>a+b, 0) / 3);
      data.push({ date: dateStr, actual: null, projected: avg });
      // slide window
      last3.shift();
      last3.push(avg);
    }
    // Connect the line: set the 'projected' value of today to match 'actual' so the line is continuous
    data[days - 1].projected = data[days - 1].actual;
  }
  
  return data;
}


