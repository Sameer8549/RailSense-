import { create } from "zustand";
import { persist } from "zustand/middleware";
import { INCIDENTS, severityScore } from "@/data/incidents.js";
import { authenticate } from "@/data/staff.js";

// Simulate async fetch (replace with Zoho Catalyst calls)
const mockFetch = (data, ms = 800) => new Promise(r => setTimeout(() => r(data), ms));

export const useStaffStore = create(
  persist(
    (set, get) => ({
      // ── Auth ───────────────────────────────────────────────────
      session: null,     // { id, name, role, train, coach }
      loginError: null,
      loginStatus: "idle", // idle | loading | error | success

      login: async (staffId, pin) => {
        set({ loginStatus: "loading", loginError: null });
        await mockFetch(null, 400); // simulate network
        const staff = authenticate(staffId, pin);
        if (staff) {
          set({ session: staff, loginStatus: "success", loginError: null });
        } else {
          set({ loginStatus: "error", loginError: "Invalid Staff ID or PIN. Try TTE-104 / 0000 or ADM-003 / 0000." });
        }
      },

      logout: () => set({ session: null, loginStatus: "idle", loginError: null,
        selectedIncidentId: null, incidents: [], incidentsStatus: "idle" }),

      // ── Theme ──────────────────────────────────────────────────
      theme: "system", // "light" | "dark" | "system"

      setTheme: (theme) => {
        set({ theme });
        const root = document.documentElement;
        if (theme === "dark") {
          root.classList.add("dark");
        } else if (theme === "light") {
          root.classList.remove("dark");
        } else {
          // system
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          if (prefersDark) root.classList.add("dark");
          else root.classList.remove("dark");
        }
      },

      // ── Global Queue Filters ───────────────────────────────────
      queueFilter: { search: "", severity: "all", recurringOnly: false, coach: "all", train: "all", period: "30d", status: "open" },
      setQueueFilter: (partial) => set((s) => ({ queueFilter: { ...s.queueFilter, ...partial } })),
      clearQueueFilter: () => set({ queueFilter: { search: "", severity: "all", recurringOnly: false, coach: "all", train: "all", period: "30d", status: "open" } }),

      // ── Dashboard / Command Center Filters ─────────────────────
      dashboardFilter: { dateRange: 30, route: "all", train: "all", severity: "all", issueType: "all" },
      setDashboardFilter: (partial) => set((s) => ({ dashboardFilter: { ...s.dashboardFilter, ...partial } })),
      clearDashboardFilter: () => set({ dashboardFilter: { dateRange: 30, route: "all", train: "all", severity: "all", issueType: "all" } }),

      // ── Incidents ──────────────────────────────────────────────
      incidents: [],
      incidentsStatus: "idle", // idle | loading | loaded | error

      selectedIncidentId: null,
      selectedStatus: "idle",

      actionStatus: "idle", // idle | submitting | done | error

      fetchIncidents: async () => {
        set({ incidentsStatus: "loading" });
        try {
          const data = await mockFetch([...INCIDENTS]);
          set({ incidentsStatus: "loaded", incidents: data });
        } catch {
          set({ incidentsStatus: "error" });
        }
      },

      selectIncident: (id) => set({ selectedIncidentId: id }),
      clearSelected: () => set({ selectedIncidentId: null }),

      getSelectedIncident: () => {
        const { incidents, selectedIncidentId } = get();
        return incidents.find(i => i.id === selectedIncidentId) || null;
      },

      // ── Actions ────────────────────────────────────────────────
      submitAction: async ({ incidentId, type, note, assignee, newSeverity, reason, mergeWith }) => {
        set({ actionStatus: "submitting" });
        const { session } = get();
        const byLabel = session ? `${session.id} ${session.name}` : "Staff";
        try {
          await mockFetch(null, 900);
          set((s) => {
            const updated = s.incidents.map((inc) => {
              if (inc.id !== incidentId) return inc;
              const baseAction = { by: byLabel, at: new Date().toISOString(), note };

              switch (type) {
                case "markAction":
                  return { ...inc, currentStatus: "resolved", actions: [...inc.actions, { ...baseAction, type }] };
                case "escalate":
                  return { ...inc, currentStatus: "escalated", actions: [...inc.actions, { ...baseAction, type }] };
                case "markDuplicate":
                  return { ...inc, currentStatus: "duplicate", actions: [...inc.actions, { ...baseAction, type, reason }] };
                case "confirmOnSite":
                  return { ...inc, evidence: { ...inc.evidence, confidence: "verified" }, actions: [...inc.actions, { ...baseAction, type }] };
                case "assignMaintenance":
                  return { ...inc, assignee: assignee || byLabel, currentStatus: "assigned", actions: [...inc.actions, { ...baseAction, type }] };
                case "scheduleInspection":
                  return { ...inc, currentStatus: "inspectionScheduled", actions: [...inc.actions, { ...baseAction, type }] };
                case "verifyResolution":
                  return { ...inc, resolutionHeld: true, currentStatus: "verified", actions: [...inc.actions, { ...baseAction, type }] };
                case "markResolutionFailed":
                  return { ...inc, resolutionHeld: false, currentStatus: "open", actions: [...inc.actions, { ...baseAction, type }] };
                case "adjustSeverity":
                  return { ...inc, severity: newSeverity, actions: [...inc.actions, { ...baseAction, type, reason }] };
                case "mergeIncidents":
                  return { ...inc, currentStatus: "merged", actions: [...inc.actions, { ...baseAction, type, mergeWith }] };
                default:
                  return { ...inc, actions: [...inc.actions, baseAction] };
              }
            });
            return { actionStatus: "done", incidents: updated };
          });
          setTimeout(() => set({ actionStatus: "idle" }), 2500);
        } catch {
          set({ actionStatus: "error" });
        }
      },

      // ── Sorted incident helpers ────────────────────────────────
      getSortedForRole: (role) => {
        const { incidents, session } = get();
        if (role === "tte") {
          // TTE: filter unresolved, prefer their assigned train
          return [...incidents]
            .filter(i => !["resolved","verified","duplicate","merged"].includes(i.currentStatus))
            .sort((a, b) => {
              // Boost incidents on this TTE's assigned train
              const aMatch = session?.train && a.train === session.train ? -1000 : 0;
              const bMatch = session?.train && b.train === session.train ? -1000 : 0;
              return (aMatch - bMatch) || (severityScore(b) - severityScore(a));
            });
        }
        // Admin: all incidents, sorted by severity score desc
        return [...incidents].sort((a, b) => severityScore(b) - severityScore(a));
      },
    }),
    {
      name: "rs_staff_v2",
      partialize: (s) => ({ session: s.session, theme: s.theme }),
    }
  )
);
