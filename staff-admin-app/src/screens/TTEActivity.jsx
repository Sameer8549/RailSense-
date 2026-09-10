import { useEffect } from "react";
import { motion } from "motion/react";
import { Activity, CheckCircle2, Zap, Clock, ChevronRight } from "lucide-react";
import { useStaffStore } from "@/store/staffStore.js";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils.js";

const SEV_BADGE = {
  high:   "bg-red-100 text-red-700 border-red-200 dark:bg-red-950  dark:border-red-900",
  medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950  dark:border-amber-900",
  low:    "bg-green-100 text-green-700 border-green-200 dark:bg-green-950  dark:border-green-900",
};

function timeAgo(ts) {
  const m = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function TTEActivity() {
  const navigate = useNavigate();
  const fetchIncidents = useStaffStore((s) => s.fetchIncidents);
  const incidents = useStaffStore((s) => s.incidents);
  const status = useStaffStore((s) => s.incidentsStatus);
  const session = useStaffStore((s) => s.session);
  const selectIncident = useStaffStore((s) => s.selectIncident);

  useEffect(() => { if (status === "idle") fetchIncidents(); }, []);

  const myActions = incidents.flatMap(inc =>
    (inc.actions || [])
      .filter(a => a.by?.includes(session?.id ?? ""))
      .map(a => ({ ...a, incidentId: inc.id, summary: inc.summary, severity: inc.severity, train: inc.train, coach: inc.coach }))
  ).sort((a, b) => new Date(b.at) - new Date(a.at));

  const myAssigned = incidents.filter(inc =>
    inc.assignee?.includes(session?.id ?? "") &&
    !["resolved","verified"].includes(inc.currentStatus)
  );

  const openCount = incidents.filter(i => !["resolved","verified","duplicate","merged"].includes(i.currentStatus)).length;
  const loading = status !== "loaded";

  return (
    <div className="overflow-auto flex-1 p-6 space-y-6 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" /> My Activity
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{session?.name} · {session?.id}</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Actions taken",   value: myActions.length,  icon: CheckCircle2, color: "text-green-500" },
          { label: "Assigned to me",  value: myAssigned.length, icon: Zap,          color: "text-blue-500" },
          { label: "Open incidents",  value: openCount,         icon: Clock,        color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <s.icon className={cn("w-5 h-5 shrink-0", s.color)} />
            <div className="min-w-0">
              <div className="text-2xl font-extrabold tabular-nums">{loading ? "–" : s.value}</div>
              <div className="text-xs text-muted-foreground truncate">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Assigned to me */}
      {!loading && myAssigned.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-sm font-semibold">Assigned to me</div>
          <div className="divide-y divide-border">
            {myAssigned.map(inc => (
              <button key={inc.id} type="button"
                onClick={() => { selectIncident(inc.id); navigate("/queue"); }}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
              >
                <span className={cn("shrink-0 w-1.5 h-10 rounded-full",
                  inc.severity === "high" ? "bg-red-500" : inc.severity === "medium" ? "bg-amber-500" : "bg-green-500")} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs text-muted-foreground">{inc.id}</span>
                    <span className={cn("text-[10px] font-bold px-1.5 py-px rounded border", SEV_BADGE[inc.severity])}>{inc.severity}</span>
                  </div>
                  <p className="text-sm truncate">{inc.summary}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent actions */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <div className="text-sm font-semibold">My recent actions</div>
          <div className="text-xs text-muted-foreground">Actions logged under your Staff ID</div>
        </div>
        {loading ? (
          <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : myActions.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No actions recorded yet.<br />
            <span className="text-xs">Use the Incident Queue to act on incidents.</span>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {myActions.slice(0, 10).map((a, i) => (
              <motion.button key={i} type="button"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                onClick={() => { selectIncident(a.incidentId); navigate("/queue"); }}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs text-muted-foreground">{a.incidentId}</span>
                    {a.severity && <span className={cn("text-[10px] font-bold px-1.5 py-px rounded border", SEV_BADGE[a.severity])}>{a.severity}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{a.note}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{timeAgo(a.at)}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}