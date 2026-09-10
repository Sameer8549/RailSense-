import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, ArrowUpFromLine, CheckCircle2, Copy, AlertTriangle,
  Calendar, RefreshCw, GitMerge, SlidersHorizontal,
  UserCheck, User, ChevronDown, ChevronUp, Loader2, AlertOctagon, Star
} from "lucide-react";
import { useStaffStore } from "@/store/staffStore.js";
import { ISSUE_TYPES } from "@/data/incidents.js";
import { Button } from "@/components/ui/button.jsx";
import EvidenceViewer from "@/components/EvidenceViewer.jsx";
import { cn } from "@/lib/utils.js";

// ── Constants ──────────────────────────────────────────────────────
const SEV = {
  high:   { badge: "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20  dark:border-red-500/30",   bar: "border-l-red-500 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]",   dot: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" },
  medium: { badge: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20  dark:border-amber-500/30", bar: "border-l-amber-500 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]", dot: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" },
  low:    { badge: "bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/20  dark:border-green-500/30",  bar: "border-l-green-500 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]", dot: "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" },
};
const STATUS = {
  filed:"Filed", acknowledged:"Acknowledged", underReview:"Under Review",
  resolved:"Resolved", escalated:"Escalated", assigned:"Assigned",
  inspectionScheduled:"Inspection Scheduled", verified:"Verified",
  duplicate:"Duplicate", merged:"Merged", open:"Open",
};
const CLOSED = ["resolved","escalated","duplicate","merged","verified"];

function fmt(ts) { return ts ? new Date(ts).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"; }

function Bdg({ sev, children, layoutId }) {
  return (
    <motion.span layoutId={layoutId} className={cn("inline-flex text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", SEV[sev]?.badge ?? "border-border text-muted-foreground bg-muted")}>
      {children}
    </motion.span>
  );
}

// ── Collapsible panel ─────────────────────────────────────────────
function Expand({ label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border bg-muted rounded-xl overflow-hidden shadow-sm">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/80 hover:bg-muted/80 transition-colors text-left">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground/70 font-display">{label}</span>
        {open ? <ChevronUp className="w-4 h-4 text-foreground/50" /> : <ChevronDown className="w-4 h-4 text-foreground/50" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }} className="overflow-hidden">
            <div className="px-4 py-3 space-y-4 border-t border-border bg-background/50 backdrop-blur-sm">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Button primitives ─────────────────────────────────────────────
function TxtInput({ placeholder, value, onChange, mono }) {
  return <input type="text" placeholder={placeholder} value={value} onChange={onChange}
    className={cn("w-full h-10 px-3 text-sm border border-border rounded-xl bg-background/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-inner", mono && "font-mono")} />;
}
function Txta({ placeholder, value, onChange, rows = 2 }) {
  return <textarea placeholder={placeholder} value={value} onChange={onChange} rows={rows}
    className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background/50 focus:bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-inner" />;
}

// ══════════════════════════════════════════════════════════════════
// TTE Sticky Action Bar
// ══════════════════════════════════════════════════════════════════
function TTEActionBar({ inc }) {
  const submitAction = useStaffStore((s) => s.submitAction);
  const actionStatus = useStaffStore((s) => s.actionStatus);
  const actionError = useStaffStore((s) => s.actionError);
  const [note, setNote] = useState("");
  const [dupReason, setDupReason] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [showDup, setShowDup] = useState(false);

  const busy = actionStatus === "submitting";
  const done = actionStatus === "done";
  const closed = CLOSED.includes(inc.currentStatus);

  if (closed) {
    return (
      <div className={cn(
        "shrink-0 border-t border-border px-6 py-4 bg-background/80 backdrop-blur-xl shadow-[0_-10px_30px_rgba(0,0,0,0.1)]",
        "flex items-center gap-3 text-sm font-semibold rounded-t-3xl",
        ["resolved","verified"].includes(inc.currentStatus)
          ? "text-green-600  bg-green-500/5"
          : "text-muted-foreground bg-muted"
      )}>
        <CheckCircle2 className="w-5 h-5 shrink-0" />
        Incident {STATUS[inc.currentStatus] ?? inc.currentStatus} — no further TTE action needed.
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur-xl shadow-[0_-10px_30px_rgba(0,0,0,0.1)] rounded-t-3xl overflow-hidden relative z-20">
      {/* Recurrence warning */}
      {inc.recurrenceCount > 1 && (
        <div className="flex items-center gap-3 px-6 py-3 border-b border-amber-500/20 bg-amber-500/10 backdrop-blur-sm">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.5)] rounded-full bg-amber-500/20" />
          <span className="text-xs font-bold text-amber-600  uppercase tracking-widest">
            {inc.recurrenceCount}× in {inc.recurrencePeriod} — confirm physical fix
          </span>
        </div>
      )}

      {/* Expandable note input */}
      <AnimatePresence>
        {showNote && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden border-b border-border bg-muted">
            <div className="px-6 py-4">
              <Txta placeholder="What action did you take?" value={note} onChange={e => setNote(e.target.value)} rows={2} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duplicate expand */}
      <AnimatePresence>
        {showDup && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden border-b border-border bg-muted">
            <div className="px-6 py-4 flex gap-3">
              <TxtInput placeholder="Reason code (required)" value={dupReason} onChange={e => setDupReason(e.target.value)} />
              <Button variant="outline" disabled={!dupReason || busy} className="rounded-xl font-bold"
                onClick={() => { submitAction({ incidentId: inc.id, type: "markDuplicate", note: "Duplicate: " + dupReason, reason: dupReason }); setShowDup(false); }}>
                Confirm
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action button row */}
      <div className="px-5 py-4 grid grid-cols-2 gap-3">
        <Button size="lg" className="w-full rounded-2xl h-12 shadow-lg shadow-primary/20 font-bold tracking-wide"
          onClick={() => submitAction({ incidentId: inc.id, type: "markAction", note: note || "Resolved on site" })}
          disabled={busy}>
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          {done ? "Saved!" : "Resolve"}
        </Button>
        <Button size="lg" variant="destructive" className="w-full rounded-2xl h-12 shadow-lg shadow-red-500/20 font-bold tracking-wide border-0 bg-red-500 hover:bg-red-600 text-white"
          onClick={() => submitAction({ incidentId: inc.id, type: "escalate", note: note || "Escalating — requires admin action" })}
          disabled={busy}>
          <ArrowUpFromLine className="w-5 h-5" />
          Escalate
        </Button>
        <Button size="lg" variant="outline" className="w-full rounded-2xl h-12 border-border hover:bg-white/5 font-bold tracking-wide"
          onClick={() => submitAction({ incidentId: inc.id, type: "confirmOnSite", note: "Verified on site" })}
          disabled={busy || inc.evidence?.confidence === "verified"}>
          <UserCheck className="w-5 h-5" />
          {inc.evidence?.confidence === "verified" ? "✓" : "Verify"}
        </Button>
        <Button size="lg" variant="secondary" className="w-full rounded-2xl h-12 font-bold tracking-wide hover:bg-white/10 border border-border"
          onClick={() => { setShowDup(!showDup); setShowNote(false); }}>
          <Copy className="w-5 h-5" />
          Duplicate
        </Button>
      </div>
      <div className="flex items-center gap-3 px-6 pb-4 text-xs font-bold text-muted-foreground">
        <button type="button" onClick={() => { setShowNote(!showNote); setShowDup(false); }}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors uppercase tracking-widest bg-muted px-3 py-1.5 rounded-lg border border-border">
          <ChevronDown className="w-3.5 h-3.5" /> Add note
        </button>
      </div>
      {actionError && <p className="px-6 pb-4 text-xs font-semibold text-red-500" role="alert">{actionError}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Admin Action Panel
// ══════════════════════════════════════════════════════════════════
function AdminActions({ inc }) {
  const submitAction = useStaffStore((s) => s.submitAction);
  const actionStatus = useStaffStore((s) => s.actionStatus);
  const actionError = useStaffStore((s) => s.actionError);
  const [note, setNote] = useState("");
  const [assignee, setAssignee] = useState("");
  const [mergeId, setMergeId] = useState("");
  const [newSev, setNewSev] = useState(inc.severity);
  const [sevReason, setSevReason] = useState("");

  const busy = actionStatus === "submitting";
  const done = actionStatus === "done";
  const sub = (type, extra = {}) => submitAction({ incidentId: inc.id, type, note: note || undefined, ...extra });
  const isOvercharge = inc.issueTypes.includes("overcharge");

  return (
    <div className="space-y-4">
      <Txta placeholder="Action note — required for escalations and assignments" value={note} onChange={e => setNote(e.target.value)} />

      {/* Policy Match Admin Action */}
      {isOvercharge && (
        <div className="p-5 bg-destructive/10 border border-destructive/30 rounded-2xl shadow-xl shadow-red-500/5 relative overflow-hidden">
          
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30">
                <AlertOctagon className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <div className="text-base font-black font-display tracking-tight text-red-600 ">Policy Violation Action Required</div>
                <div className="text-xs font-medium text-red-600/70 /70 mt-0.5">Contractor requires formal caution notice as per §7.2(b).</div>
              </div>
            </div>
            <Button size="lg" className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20 font-bold tracking-wide" disabled={busy} onClick={() => sub("issueCautionNotice", { note: note || "Formal Caution Notice Issued to Pantry Contractor" })}>
              Issue Caution Notice
            </Button>
          </div>
        </div>
      )}

      {/* Assign */}
      <div className="flex gap-3">
        <TxtInput placeholder="Assignee name or staff ID" value={assignee} onChange={e => setAssignee(e.target.value)} />
        <Button disabled={busy || !assignee} onClick={() => { sub("assignMaintenance", { assignee }); setAssignee(""); }} className="rounded-xl px-6 font-bold shadow-md shadow-primary/10">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
          Assign
        </Button>
      </div>

      {/* Primary admin actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" disabled={busy} onClick={() => sub("scheduleInspection", { note: note || "Inspection scheduled" })} className="rounded-xl h-11 border-border hover:bg-white/5 font-bold">
          <Calendar className="w-4 h-4" /> Schedule Inspection
        </Button>
        <Button variant={inc.resolutionHeld ? "default" : "outline"} disabled={busy}
          onClick={() => sub("verifyResolution", { note: note || "Resolution verified" })} className={cn("rounded-xl h-11 font-bold", !inc.resolutionHeld && "border-border hover:bg-white/5")}>
          <RefreshCw className="w-4 h-4" />
          {inc.resolutionHeld ? "✓ Verified" : "Verify Resolution"}
        </Button>
      </div>

      {/* Merge */}
      <Expand label="Merge related incidents">
        <p className="text-xs font-medium text-muted-foreground mb-3">Enter the ID of the incident to merge into.</p>
        <div className="flex gap-3">
          <TxtInput placeholder="e.g. RS-2026-00028" value={mergeId} onChange={e => setMergeId(e.target.value.toUpperCase())} mono />
          <Button variant="destructive" disabled={!mergeId || busy} className="rounded-xl px-6 font-bold bg-red-500 hover:bg-red-600"
            onClick={() => { sub("mergeIncidents", { mergeWith: mergeId }); setMergeId(""); }}>
            <GitMerge className="w-4 h-4" /> Merge
          </Button>
        </div>
      </Expand>

      {/* Severity */}
      <Expand label="Adjust severity">
        <p className="text-xs font-medium text-muted-foreground mb-3">Current: <strong className="uppercase tracking-widest text-foreground">{inc.severity}</strong></p>
        <div className="flex gap-2 mb-3">
          {["high","medium","low"].map(s => (
            <button key={s} type="button" onClick={() => setNewSev(s)}
              className={cn("flex-1 h-10 text-xs font-black uppercase tracking-widest rounded-xl border transition-all shadow-sm",
                newSev === s
                  ? (s === "high" ? "bg-red-500 border-red-500 text-white shadow-red-500/20"
                    : s === "medium" ? "bg-amber-500 border-amber-500 text-white shadow-amber-500/20"
                    : "bg-green-500 border-green-500 text-white shadow-green-500/20")
                  : "border-border bg-muted hover:bg-muted hover:bg-muted"
              )}>
              {s}
            </button>
          ))}
        </div>
        <TxtInput placeholder="Reason (required)" value={sevReason} onChange={e => setSevReason(e.target.value)} />
        <Button disabled={!sevReason || busy || newSev === inc.severity} className="w-full mt-3 rounded-xl h-11 font-bold shadow-md shadow-primary/10"
          onClick={() => { sub("adjustSeverity", { newSeverity: newSev, reason: sevReason }); setSevReason(""); }}>
          <SlidersHorizontal className="w-4 h-4" /> Apply Changes
        </Button>
      </Expand>
      {actionError && <p className="text-xs font-semibold text-red-500" role="alert">{actionError}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// Main export
// ══════════════════════════════════════════════════════════════════
export default function IncidentBrief({ onClose, fullscreen }) {
  const selectedId = useStaffStore((s) => s.selectedIncidentId);
  const briefFocusSection = useStaffStore((s) => s.briefFocusSection);
  const incidents = useStaffStore((s) => s.incidents);
  const session = useStaffStore((s) => s.session);
  const status = useStaffStore((s) => s.incidentsStatus);

  const rootCauseRef = useRef(null);
  const forecastRef = useRef(null);
  const verifyRef = useRef(null);
  const executionPanelRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const inc = incidents.find(i => i.id === selectedId);
  const isAdmin = session?.role === "admin";

  useEffect(() => {
    if (briefFocusSection && scrollContainerRef.current) {
      setTimeout(() => {
        let el = null;
        if (briefFocusSection === "rootCause") el = rootCauseRef.current;
        if (briefFocusSection === "forecast") el = forecastRef.current;
        if (briefFocusSection === "verify") el = verifyRef.current || executionPanelRef.current;
        
        if (el && scrollContainerRef.current) {
          const top = el.offsetTop - 80;
          scrollContainerRef.current.scrollTo({ top, behavior: 'smooth' });
        }
      }, 50);
    }
  }, [briefFocusSection, selectedId]);

  if (!selectedId) return null;
  if (status !== "loaded" || !inc) {
    return <div className="p-6 space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted/50 rounded-2xl animate-pulse" />)}</div>;
  }

  const sev = SEV[inc.severity] ?? {};

  return (
    <div className={cn("flex flex-col bg-background/95 backdrop-blur-3xl relative", fullscreen ? "h-screen" : "h-full w-full")}>
      
      {/* Background glow behind sidebar */}
      <div className="absolute top-0 right-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      {/* ── Sticky header ── */}
      <div className="shrink-0 border-b border-border bg-background/50 backdrop-blur-xl px-5 py-4 flex items-start justify-between gap-4 z-10 shadow-sm relative">
        <div className="flex flex-wrap items-center gap-2 min-w-0 mt-0.5">
          <motion.span layoutId={`id-${inc.id}`} className="font-mono text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border">{inc.id}</motion.span>
          <Bdg sev={inc.severity} layoutId={`badge-${inc.id}`}>{inc.severity}</Bdg>
          <span className="text-[10px] font-bold uppercase tracking-widest border border-border px-2 py-0.5 rounded-full text-foreground/70 bg-muted shadow-sm">
            {STATUS[inc.currentStatus] ?? inc.currentStatus}
          </span>
          {inc.recurrenceCount > 1 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary shadow-sm">
              {inc.recurrenceCount}× recurrence
            </span>
          )}
        </div>
        <button type="button" onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted hover:bg-muted hover:bg-muted transition-colors border border-border shrink-0 shadow-sm">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div ref={scrollContainerRef} className={cn("flex-1 overflow-y-auto relative z-0 scroll-smooth", isAdmin ? "pb-6" : "pb-0")}>
        <div className="p-5 space-y-6 max-w-2xl mx-auto">

          {/* Severity + Summary — LARGEST, BOLDEST */}
          <div className={cn("rounded-2xl border border-border p-6 bg-card/40 backdrop-blur-md shadow-lg shadow-black/5 relative overflow-hidden", sev.bar)}>
            
            
            {/* One-line glanceable summary */}
            <div className="flex items-start gap-4 mb-5 relative z-10">
              <div className={cn("w-4 h-4 rounded-full mt-1.5 shrink-0 border-2 border-background", sev.dot)} />
              <p className="font-black font-display text-xl leading-tight tracking-tight text-foreground">{inc.summary}</p>
            </div>

            {/* Core info */}
            <div className="flex items-center justify-between gap-4 mb-5 flex-wrap relative z-10">
              <div className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <span className="bg-muted px-2.5 py-1 rounded-md border border-border">Train {inc.train}</span>
                <span>·</span>
                <span className="bg-muted px-2.5 py-1 rounded-md border border-border">Coach {inc.coach}</span>
                {inc.berth ? <><span className="text-muted-foreground/50">·</span> <span className="bg-muted px-2.5 py-1 rounded-md border border-border">Berth {inc.berth}</span></> : ""}
                {inc.pnr ? <><span className="text-muted-foreground/50">·</span> <span className="font-mono bg-muted px-2.5 py-1 rounded-md border border-border">PNR {inc.pnr}</span></> : ""}
              </div>
              <div className={cn("flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border font-bold shrink-0 shadow-sm transition-colors",
                inc.assignee
                  ? "border-green-500/20 bg-green-500/10 text-green-600 "
                  : "border-border bg-muted text-muted-foreground"
              )}>
                {inc.assignee ? <UserCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                {inc.assignee ?? "Unassigned"}
              </div>
            </div>

            {/* Issue tags */}
            <div className="flex flex-wrap gap-2 mb-3 relative z-10">
              {inc.issueTypes.map(t => (
                <span key={t} className="text-[10px] font-bold uppercase tracking-widest bg-muted border border-border px-3 py-1 rounded-md text-foreground/80 shadow-sm">
                  {ISSUE_TYPES[t]?.label ?? t}
                </span>
              ))}
            </div>
            <div className="text-xs font-bold text-muted-foreground relative z-10">{fmt(inc.filedAt)}</div>
          </div>

          {/* Recurrence — second tier */}
          {inc.recurrenceCount > 1 && (
            <div className="flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 backdrop-blur-md px-5 py-4 shadow-lg shadow-amber-500/5">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="font-black font-display text-amber-600  tracking-tight text-lg leading-none mb-1">
                  {inc.recurrenceCount} complaints in {inc.recurrencePeriod}
                </div>
                {inc.resolvedAttempts?.length > 0 && (
                  <p className="text-xs font-semibold text-amber-600/80 dark:text-amber-500/80">
                    {inc.resolvedAttempts.length} prior "resolved" marks did not hold.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Evidence — third tier */}
          {(inc.evidence?.hasPhoto || inc.evidence?.hasAudio) && (
            <div>
              <div className="text-[11px] font-black text-foreground/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Evidence Logs
              </div>
              <EvidenceViewer evidence={inc.evidence} />
            </div>
          )}

          {/* AI Analysis */}
          {inc.aiSummary && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-md p-5 shadow-lg shadow-primary/5 relative overflow-hidden">
              
              <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]" />
                RailSense AI Analysis
              </div>
              <p className="text-sm font-medium text-foreground/80 leading-relaxed relative z-10">{inc.aiSummary}</p>
            </div>
          )}

          {/* Admin-only intelligence */}
          {isAdmin && (
            <>
              {inc.rootCause && (
                <div ref={rootCauseRef} className="rounded-2xl border border-border bg-card/40 backdrop-blur-md p-5 shadow-lg shadow-black/5 transition-colors">
                  <div className="text-[11px] font-black text-foreground/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                    Root Cause
                  </div>
                  <p className="text-sm font-medium text-foreground/80 leading-relaxed">{inc.rootCause}</p>
                </div>
              )}
              {inc.recurrenceForecast && (
                <div ref={forecastRef} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-md p-5 shadow-lg shadow-amber-500/5 transition-colors">
                  <div className="text-[11px] font-black text-amber-600  uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Recurrence Forecast
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-4xl font-black font-display text-amber-600  tabular-nums tracking-tighter">
                      {Math.round(inc.recurrenceForecast.probability * 100)}%
                    </span>
                    <span className="text-sm font-bold text-amber-600/80 dark:text-amber-500/80 leading-tight max-w-[200px]">
                      probability within {inc.recurrenceForecast.nextOccurrenceDays} days if unresolved
                    </span>
                  </div>
                  <p className="text-xs font-medium text-amber-600/60 dark:text-amber-500/60">{inc.recurrenceForecast.basis}</p>
                </div>
              )}
              {inc.recommendedAction && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-md p-5 shadow-lg shadow-red-500/5">
                  <div className="text-[11px] font-black text-red-600  uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Recommended Action
                  </div>
                  <p className="text-sm font-bold text-red-600/90 /90 leading-relaxed">{inc.recommendedAction}</p>
                  {inc.actionPlan?.steps?.length > 0 && (
                    <ol className="mt-3 space-y-1.5 text-xs font-semibold text-foreground/75 list-decimal list-inside">
                      {inc.actionPlan.steps.map((step) => <li key={step}>{step}</li>)}
                    </ol>
                  )}
                </div>
              )}
              {inc.relatedIncidents?.length > 0 && (
                <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-md p-5 shadow-lg shadow-black/5">
                  <div className="text-[11px] font-black text-foreground/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                    Related Incidents
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {inc.relatedIncidents.map(id => (
                      <span key={id} className="font-mono text-xs font-bold bg-muted border border-border px-2.5 py-1.5 rounded-lg shadow-sm">{id}</span>
                    ))}
                  </div>
                </div>
              )}
              {inc.policyMatch && (
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 backdrop-blur-md p-5 shadow-lg shadow-orange-500/5 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-[30px] pointer-events-none" />
                  <div className="text-[11px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Price Violation — {inc.policyMatch.category}
                  </div>
                  
                  {/* Contractor Rating History */}
                  <div className="flex items-center gap-4 mb-5 pb-5 border-b border-orange-500/20 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-orange-500 shadow-sm flex items-center justify-center shrink-0 border border-border">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-base font-black font-display text-foreground tracking-tight">A.K. Catering Services</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex gap-0.5">
                          {[1,2,3].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500 drop-shadow-sm" />)}
                          <Star className="w-3.5 h-3.5 fill-muted text-muted" />
                          <Star className="w-3.5 h-3.5 fill-muted text-muted" />
                        </div>
                        <span className="text-xs text-muted-foreground font-bold ml-1.5">2.8/5 (14 violations)</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm relative z-10">
                    {[["MRP", inc.policyMatch.mrpBottle, ""], ["Charged", inc.policyMatch.chargedAmount, "text-red-600 "], ["Overcharge", inc.policyMatch.overchargeAmount, "text-red-600 "]].map(([l, v, cls]) => (
                      <div key={l} className="bg-muted rounded-xl p-3 border border-border text-center shadow-inner">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{l}</div>
                        <div className={cn("font-black font-display text-lg", cls)}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Actions log */}
          {inc.actions?.length > 0 && (
            <Expand label={"Actions log (" + inc.actions.length + ")"}>
              {inc.actions.map((a, i) => (
                <div key={i} className="flex gap-4 text-xs py-2 border-b border-border last:border-0 relative">
                  <div className="absolute left-[-16px] top-4 w-1 h-1 rounded-full bg-primary/50" />
                  <span className="text-muted-foreground shrink-0 w-32 font-medium">{fmt(a.at)}</span>
                  <span className="font-bold text-primary shrink-0 max-w-[100px] truncate">{a.by}</span>
                  <span className="text-foreground/80 font-medium min-w-0 break-words">{a.note}</span>
                </div>
              ))}
            </Expand>
          )}

          {/* Admin action panel */}
          {isAdmin && (
            <div ref={executionPanelRef} className="border-t border-border pt-6 mt-6 transition-colors">
              <div className="text-[11px] font-black text-foreground/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                Admin Execution Panel
              </div>
              <AdminActions inc={inc} />
            </div>
          )}

        </div>
      </div>

      {/* ── TTE sticky action bar (always at bottom, no scroll needed) ── */}
      {!isAdmin && <TTEActionBar inc={inc} />}
    </div>
  );
}
