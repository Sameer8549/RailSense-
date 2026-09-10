import { create } from "zustand";
import { persist } from "zustand/middleware";
import { INCIDENTS, severityScore } from "@/data/incidents.js";
import { getUpdatesSince, loginStaff, submitStaffAction } from "@/lib/staffApi.js";

export const useStaffStore = create(
  persist(
    (set, get) => ({
      // ── Auth ───────────────────────────────────────────────────
      session: null,     // { id, name, role, train, coach }
      loginError: null,
      loginStatus: "idle", // idle | loading | error | success
      actionStatus: "idle",
      actionError: null,
      lastUpdatedAt: null,
      liveStatus: "idle",
      liveError: null,
      pollTimer: null,

      login: async (staffId, pin) => {
        set({ loginStatus: "loading", loginError: null });
        try {
          const data = await loginStaff(staffId, pin);
          set({ session: data.staff || data.session, loginStatus: "success", loginError: null });
          await get().fetchIncidents();
          get().startPolling();
        } catch {
          set({ loginStatus: "error", loginError: "Invalid Staff ID or PIN. Try TTE-104 / 0000 or ADM-003 / 0000." });
        }
      },

      logout: () => set({ session: null, loginStatus: "idle", loginError: null,
        selectedIncidentId: null, incidents: [], incidentsStatus: "idle", pollTimer: null }),

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
          const data = await getUpdatesSince(null, true);
          const liveIncidents = markLive(data.allIncidents || data.incidents || []);
          set({
            incidentsStatus: "loaded",
            incidents: mergeIncidents(liveIncidents, INCIDENTS),
            lastUpdatedAt: data.serverTime || new Date().toISOString(),
            liveStatus: "connected",
            liveError: null
          });
        } catch {
          set({ incidentsStatus: "error", liveStatus: "error", liveError: "Could not load live incidents." });
        }
      },

      pollUpdates: async () => {
        if (document.hidden || !get().session) return;
        try {
          const data = await getUpdatesSince(get().lastUpdatedAt, true);
          const fresh = markLive(data.incidents || []);
          const allLive = markLive(data.allIncidents || []);
          set((s) => ({
            incidents: allLive.length ? mergeIncidents(allLive, INCIDENTS) : mergeIncidents(s.incidents, fresh)
          }));
          set({ lastUpdatedAt: data.serverTime || new Date().toISOString(), liveStatus: "connected", liveError: null });
        } catch {
          set({ liveStatus: "error", liveError: "Live sync paused. Retrying..." });
        }
      },

      startPolling: () => {
        if (get().pollTimer) return;
        const timer = window.setInterval(() => get().pollUpdates(), 2500);
        set({ pollTimer: timer, liveStatus: "connected" });
      },

      stopPolling: () => {
        const timer = get().pollTimer;
        if (timer) window.clearInterval(timer);
        set({ pollTimer: null, liveStatus: "idle" });
      },

      selectIncident: (id) => set({ selectedIncidentId: id }),
      clearSelected: () => set({ selectedIncidentId: null }),

      getSelectedIncident: () => {
        const { incidents, selectedIncidentId } = get();
        return incidents.find(i => i.id === selectedIncidentId) || null;
      },

      // ── Actions ────────────────────────────────────────────────
      submitAction: async ({ incidentId, type, note, assignee, newSeverity, reason, mergeWith }) => {
        set({ actionStatus: "submitting", actionError: null });
        const { session } = get();
        const target = get().incidents.find((inc) => inc.id === incidentId);
        if (target && !target.isLive) {
          set((s) => ({
            actionStatus: "done",
            incidents: s.incidents.map((inc) => inc.id === incidentId ? applyDemoAction(inc, { type, note, assignee, newSeverity, session }) : inc),
            lastUpdatedAt: new Date().toISOString()
          }));
          setTimeout(() => set({ actionStatus: "idle" }), 2500);
          return;
        }
        try {
          const response = await submitStaffAction({
            op: type,
            type,
            incidentId,
            complaintId: incidentId,
            staffId: session?.id || session?.staffId,
            note,
            assignee,
            assignedTo: assignee,
            newSeverity,
            reason,
            mergeWith
          });
          set((s) => ({
            actionStatus: "done",
            incidents: s.incidents.map((inc) => inc.id === incidentId ? { ...inc, ...(response.incident || {}) } : inc),
            lastUpdatedAt: new Date().toISOString()
          }));
          get().pollUpdates();
          setTimeout(() => set({ actionStatus: "idle" }), 2500);
        } catch (error) {
          set({ actionStatus: "error", actionError: error?.message || "Action could not be saved. Check the connection and try again." });
        }
      },

      submitBulkAction: async ({ incidentIds, type, payload }) => {
        for (const incidentId of incidentIds) {
          await get().submitAction({ incidentId, type, ...(payload || {}) });
        }
      },

      // ── Sorted incident helpers ────────────────────────────────
      getSortedForRole: (role) => {
        const { incidents, session } = get();
        if (role === "tte") {
          // TTE: filter unresolved, newest live complaints first, then assigned train and severity.
          return [...incidents]
            .filter(i => !["resolved","verified","duplicate","merged"].includes(i.currentStatus))
            .sort((a, b) => {
              const liveOrder = (b.isLive ? 1 : 0) - (a.isLive ? 1 : 0);
              if (liveOrder) return liveOrder;
              const timeOrder = new Date(b.filedAt || b.timestamp || 0) - new Date(a.filedAt || a.timestamp || 0);
              if (timeOrder) return timeOrder;
              const aMatch = session?.train && a.train === session.train ? -1000 : 0;
              const bMatch = session?.train && b.train === session.train ? -1000 : 0;
              return (aMatch - bMatch) || (severityScore(b) - severityScore(a));
            });
        }
        // Admin: live complaints first, then newest, then severity.
        return [...incidents].sort(compareIncidents);
      },
    }),
    {
      name: "rs_staff_v2",
      partialize: (s) => ({ session: s.session, theme: s.theme }),
    }
  )
);

function mergeIncidents(current, incoming) {
  const byId = new Map(current.map((incident) => [incident.id, incident]));
  for (const incident of incoming) {
    byId.set(incident.id, { ...(byId.get(incident.id) || {}), ...incident });
  }
  return [...byId.values()].sort(compareIncidents);
}

function markLive(incidents) {
  return incidents.map((incident) => ({ ...incident, source: "live", isLive: true }));
}

function compareIncidents(a, b) {
  const aLive = a.isLive ? 1 : 0;
  const bLive = b.isLive ? 1 : 0;
  if (aLive !== bLive) return bLive - aLive;
  const byTime = new Date(b.filedAt || b.timestamp || 0) - new Date(a.filedAt || a.timestamp || 0);
  if (byTime) return byTime;
  return severityScore(b) - severityScore(a);
}

function applyDemoAction(incident, { type, note, assignee, newSeverity, session }) {
  const statusMap = {
    resolve: "resolved",
    resolveIncident: "resolved",
    escalate: "escalated",
    escalateIncident: "escalated",
    assignMaintenance: "assigned",
    assignIncident: "assigned",
    scheduleInspection: "inspectionScheduled",
    verifyResolution: "verified",
    markResolutionFailed: "open",
    markDuplicate: "duplicate"
  };
  const status = statusMap[type] || incident.currentStatus;
  const now = new Date().toISOString();
  return {
    ...incident,
    currentStatus: status,
    status,
    assignee: assignee || incident.assignee,
    severity: newSeverity || incident.severity,
    actions: [
      ...(incident.actions || []),
      { by: `${session?.id || session?.staffId || "Staff"} ${session?.name || ""}`.trim(), at: now, type, note: note || "Demo action recorded locally" }
    ],
    history: [
      ...(incident.history || []),
      { complaintId: incident.id, status, timestamp: now, note: note || "Demo action recorded locally" }
    ],
    resolutionHeld: type === "verifyResolution" ? true : type === "markResolutionFailed" ? false : incident.resolutionHeld
  };
}
