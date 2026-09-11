import { create } from "zustand";
import { persist } from "zustand/middleware";
import { submitComplaint as submitComplaintApi, trackComplaint } from "../lib/railsenseApi.js";

// Slice that is NOT persisted (ephemeral UI state)
const ephemeralSlice = (set, get) => ({
  complaintDraft: {
    ticketType: "RESERVED", pnr: "", train: "", coach: "", berth: "", utsNumber: "", coachZone: "",
    issues: [], voiceTranscript: "", photoEvidence: null,
  },
  micState: "idle",
  complaintStatus: "idle",
  submittedComplaint: null,
  trackingResult: null,
  trackingStatus: "idle",

  updateDraft: (updates) =>
    set((s) => ({ complaintDraft: { ...s.complaintDraft, ...updates } })),

  setMicState: (state) => set({ micState: state }),
  setComplaintStatus: (status) => set({ complaintStatus: status }),

  submitComplaint: async () => {
    set({ complaintStatus: "submitting" });
    try {
      const draft = get().complaintDraft;
      const deviceId = get().deviceId || getOrCreateDeviceId();
      const complaint = await submitComplaintApi({
        transcript: draft.voiceTranscript || "",
        language: localStorage.getItem("rs_lang") || "en",
        pnr: draft.pnr || undefined,
        trainNumber: draft.train || undefined,
        coach: draft.coach || undefined,
        berth: draft.berth || undefined,
        ticketType: draft.ticketType || "RESERVED",
        utsNumber: draft.utsNumber || undefined,
        coachZone: draft.coachZone || undefined,
        evidencePhotoBase64: draft.evidencePhotoBase64 || undefined,
        pnrPhotoBase64: draft.pnrPhotoBase64 || undefined,
        deviceId
      });
      const record = normalizeSubmittedComplaint(complaint);
      set((s) => ({
        complaintStatus: "submitted",
        submittedComplaint: record,
        deviceId,
        localComplaints: [record, ...s.localComplaints].slice(0, 20),
      }));
    } catch (error) {
      set({ complaintStatus: "error", submittedComplaint: null, lastBackendError: error.message });
    }
  },

  trackComplaintById: async (id) => {
    set({ trackingStatus: "searching", trackingResult: null });
    try {
      const result = await trackComplaint(id.trim().toUpperCase());
      set({ trackingStatus: "found", trackingResult: normalizeTrackingResult(result) });
    } catch (error) {
      set({ trackingStatus: "not_found", lastBackendError: error.message });
    }
  },

  resetComplaint: () =>
    set({
      complaintDraft: {
        ticketType: "RESERVED", pnr: "", train: "", coach: "", berth: "", utsNumber: "", coachZone: "",
        issues: [], voiceTranscript: "", photoEvidence: null,
      },
      complaintStatus: "idle",
      submittedComplaint: null,
    }),
});

// Slice that IS persisted (settings + filed complaints list)
const persistedSlice = (set) => ({
  // Manual dark mode toggle — always defaults to light on first install
  darkMode: false,

  // Device-local list of complaints filed from this device (most-recent first)
  // Never contains live status — only enough to identify & look up the complaint
  localComplaints: [],
  deviceId: getOrCreateDeviceId(),
  lastBackendError: null,

  toggleDarkMode: () =>
    set((s) => {
      const next = !s.darkMode;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return { darkMode: next };
    }),
});

function getOrCreateDeviceId() {
  const key = "rs_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `device-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function normalizeSubmittedComplaint(complaint) {
  return {
    id: complaint.id || complaint.complaintId,
    timestamp: complaint.timestamp || complaint.createdAt || new Date().toISOString(),
    summary: complaint.summary || (complaint.issues || []).slice(0, 2).join(", ") || "General complaint",
    train: complaint.train || complaint.trainNumber || null,
    coach: complaint.coach || null,
    pnr: complaint.pnr || null,
    ticketType: complaint.ticketType || complaint.ticket_type || "RESERVED",
    utsNumber: complaint.utsNumber || complaint.identifier_number || null,
    coachZone: complaint.coachZone || null,
    intercept: complaint.intercept || null,
    issues: complaint.issues || [],
  };
}

function normalizeTrackingResult(complaint) {
  return {
    ...complaint,
    id: complaint.id || complaint.complaintId,
    train: complaint.train || complaint.trainNumber || null,
    ticketType: complaint.ticketType || complaint.ticket_type || "RESERVED",
    utsNumber: complaint.utsNumber || complaint.identifier_number || null,
    coachZone: complaint.coachZone || null,
    intercept: complaint.intercept || null,
    currentStatus: complaint.currentStatus === "under_review" ? "underReview" : (complaint.currentStatus || "filed"),
    steps: (complaint.steps || []).map((step) => ({
      ...step,
      status: step.status === "under_review" ? "underReview" : step.status,
    })),
  };
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      ...persistedSlice(set),
      ...ephemeralSlice(set, get),
    }),
    {
      name: "rs_store",          // localStorage key
      // Only persist settings + complaint list — never ephemeral UI state
      partialize: (state) => ({
        darkMode: state.darkMode,
        localComplaints: state.localComplaints,
        deviceId: state.deviceId,
      }),
    }
  )
);
