import { create } from "zustand";
import { persist } from "zustand/middleware";

function generateComplaintId() {
  const year = new Date().getFullYear();
  const num = Math.floor(10000 + Math.random() * 89999);
  return `RS-${year}-${num}`;
}

// Slice that is NOT persisted (ephemeral UI state)
const ephemeralSlice = (set, get) => ({
  complaintDraft: {
    pnr: "", train: "", coach: "", berth: "",
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

  submitComplaint: () => {
    set({ complaintStatus: "submitting" });
    // TODO: replace with Zoho Catalyst API call
    setTimeout(() => {
      const id = generateComplaintId();
      const draft = get().complaintDraft;

      // Build a human-readable summary from issues
      const summary =
        draft.issues?.length
          ? draft.issues.slice(0, 2).join(", ") +
            (draft.issues.length > 2 ? ` +${draft.issues.length - 2} more` : "")
          : draft.voiceTranscript?.slice(0, 60) || "General complaint";

      const record = {
        id,
        timestamp: new Date().toISOString(),
        summary,
        train: draft.train || null,
        coach: draft.coach || null,
        pnr: draft.pnr || null,
        issues: draft.issues || [],
      };

      set((s) => ({
        complaintStatus: "submitted",
        submittedComplaint: record,
        // Prepend to persistent list, cap at 20 entries
        localComplaints: [record, ...s.localComplaints].slice(0, 20),
      }));
    }, 1800);
  },

  trackComplaintById: (id) => {
    set({ trackingStatus: "searching", trackingResult: null });
    // TODO: replace with Zoho Catalyst API call — always fetch live, never use cached status
    setTimeout(() => {
      if (/^RS-\d{4}-\d{5}$/.test(id.trim().toUpperCase())) {
        set({
          trackingStatus: "found",
          trackingResult: {
            id: id.trim().toUpperCase(),
            train: "12951",
            coach: "B2",
            issues: ["AC not working", "Coach dirty"],
            steps: [
              { status: "filed",        timestamp: "2026-09-09T03:30:00Z", note: null },
              { status: "acknowledged", timestamp: "2026-09-09T05:15:00Z", note: "Assigned to TTE" },
              { status: "underReview",  timestamp: "2026-09-09T07:00:00Z", note: null },
            ],
            currentStatus: "underReview",
          },
        });
      } else {
        set({ trackingStatus: "not_found" });
      }
    }, 1200);
  },

  resetComplaint: () =>
    set({
      complaintDraft: {
        pnr: "", train: "", coach: "", berth: "",
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
      }),
    }
  )
);
