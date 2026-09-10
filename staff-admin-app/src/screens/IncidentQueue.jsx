import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, UserCheck, User2, ArrowUp, ArrowDown, ArrowUpDown, RefreshCw, X, Filter, Layers, CheckSquare, Search, ChevronRight, Share2, CornerDownRight, MoreVertical, Flame, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useStaffStore } from "@/store/staffStore.js";
import { ISSUE_TYPES } from "@/data/incidents.js";
import IncidentBrief from "./IncidentBrief.jsx";
import { cn } from "@/lib/utils.js";
import { Button } from "@/components/ui/button.jsx";
import { ExportMenu } from "@/components/ExportMenu.jsx";
import { PrintableReport } from "@/components/PrintableReport.jsx";

const SEV_BAR = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-green-500" };
const SEV_BADGE = {
  high:   "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20  dark:border-red-500/30",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20  dark:border-amber-500/30",
  low:    "bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/20  dark:border-green-500/30",
  recur:  "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30",
};
const STATUS_LABEL = { filed:"Filed", acknowledged:"Acknowledged", underReview:"Under Review", resolved:"Resolved", escalated:"Escalated", assigned:"Assigned", inspectionScheduled:"Scheduled", verified:"Verified", duplicate:"Duplicate", merged:"Merged", open:"Open" };

function timeAgo(ts) {
  if (!ts) return "—";
  const m = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}m` : ""}`;
}

function SortBtn({ label, col, sorting, onSort }) {
  const s = sorting && sorting._col === col;
  const asc = s && sorting._dir === "asc";
  return (
    <button type="button" onClick={() => onSort(col)}
      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm">
      {label}
      {s ? (asc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
    </button>
  );
}

export default function IncidentQueue() {
  const fetchIncidents = useStaffStore((s) => s.fetchIncidents);
  const getSortedForRole = useStaffStore((s) => s.getSortedForRole);
  const incidents = useStaffStore((s) => s.incidents);
  const session = useStaffStore((s) => s.session);
  const status = useStaffStore((s) => s.incidentsStatus);
  const selectedId = useStaffStore((s) => s.selectedIncidentId);
  const selectIncident = useStaffStore((s) => s.selectIncident);
  const clearSelected = useStaffStore((s) => s.clearSelected);
  
  // Global filters
  const queueFilter = useStaffStore((s) => s.queueFilter);
  const setQueueFilter = useStaffStore((s) => s.setQueueFilter);
  
  // Admin store methods
  const submitBulkAction = useStaffStore((s) => s.submitBulkAction);
  const actionStatus = useStaffStore((s) => s.actionStatus);
  
  const [sortCol, setSortCol] = useState("severity");
  const [sortDir, setSortDir] = useState("asc");

  // Feature Toggles & Local State
  const [isGrouped, setIsGrouped] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchInputRef = useRef(null);
  
  const isAdmin = session?.role === "admin";
  const myAssigneeLabel = session ? `${session.id} ${session.name}` : "";

  useEffect(() => { if (status === "idle") fetchIncidents(); }, []);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't interfere with input fields or command palette (Cmd+K)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.metaKey || e.ctrlKey) return;
      
      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex(i => Math.min(i + 1, displayRows.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (focusedIndex >= 0 && displayRows[focusedIndex]) {
          const item = displayRows[focusedIndex];
          if (item._isGroup) {
            toggleGroup(item.groupId);
          } else {
            selectIncident(item.id);
            // Optionally focus the detail panel here if needed
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });
  
  const raw = useMemo(() => getSortedForRole(session?.role || "tte"), [getSortedForRole, incidents, session?.role, status]);

  // Filtering & Sorting
  const processedIncidents = useMemo(() => {
    let d = raw;
    
    // Status Filter (Default open)
    if (queueFilter.status === "open") {
      d = d.filter(i => !["resolved", "verified", "merged", "duplicate"].includes(i.currentStatus));
    } else if (queueFilter.status === "resolved") {
      d = d.filter(i => ["resolved", "verified", "merged", "duplicate"].includes(i.currentStatus));
    }
    
    // Severity Filter
    if (queueFilter.severity !== "all") {
      d = d.filter(i => i.severity === queueFilter.severity);
    }
    
    // Recurrence Filter
    if (queueFilter.recurringOnly) {
      d = d.filter(i => i.recurrenceCount > 1);
    }

    // Coach/Train Filters
    if (queueFilter.coach !== "all") {
      d = d.filter(i => i.coach === queueFilter.coach);
    }
    if (queueFilter.train !== "all") {
      d = d.filter(i => i.train === queueFilter.train);
    }
    
    // Search
    if (queueFilter.search) {
      const q = queueFilter.search.toLowerCase();
      d = d.filter(i =>
        i.id.toLowerCase().includes(q) ||
        i.train?.toLowerCase().includes(q) ||
        i.coach?.toLowerCase().includes(q) ||
        i.summary?.toLowerCase().includes(q)
      );
    }

    // Sort
    d = [...d].sort((a, b) => {
        let valA, valB;
        if (sortCol === "age") {
            valA = new Date(a.filedAt).getTime();
            valB = new Date(b.filedAt).getTime();
        } else if (sortCol === "status") {
            valA = a.currentStatus;
            valB = b.currentStatus;
        } else {
            // Default Severity score (already done by getSortedForRole, but can override)
            return 0; 
        }
        
        if (valA < valB) return sortDir === "asc" ? -1 : 1;
        if (valA > valB) return sortDir === "asc" ? 1 : -1;
        return 0;
    });

    return d;
  }, [raw, queueFilter, sortCol, sortDir]);

  // Grouping Logic
  const displayRows = useMemo(() => {
      if (!isAdmin || !isGrouped) return processedIncidents;

      // Group by Train + Coach + Primary Issue Type
      const groups = {};
      processedIncidents.forEach(inc => {
          const primaryIssue = inc.issueTypes[0] || "unknown";
          const groupId = `${inc.train}-${inc.coach}-${primaryIssue}`;
          if (!groups[groupId]) groups[groupId] = [];
          groups[groupId].push(inc);
      });

      const rows = [];
      Object.entries(groups).forEach(([groupId, items]) => {
          if (items.length > 1) {
              const latest = items.sort((a, b) => new Date(b.filedAt) - new Date(a.filedAt))[0];
              rows.push({
                  _isGroup: true,
                  groupId,
                  count: items.length,
                  train: latest.train,
                  coach: latest.coach,
                  issue: latest.issueTypes[0],
                  severity: latest.severity,
                  summary: `Multiple reports: ${ISSUE_TYPES[latest.issueTypes[0]]?.label || latest.issueTypes[0]}`,
                  items
              });
              if (expandedGroups.has(groupId)) {
                  items.forEach(item => rows.push({ ...item, _isChild: true }));
              }
          } else {
              rows.push(items[0]);
          }
      });
      return rows;
  }, [processedIncidents, isGrouped, expandedGroups, isAdmin]);

  const toggleGroup = (groupId) => {
      setExpandedGroups(prev => {
          const next = new Set(prev);
          if (next.has(groupId)) next.delete(groupId);
          else next.add(groupId);
          return next;
      });
  };

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const toggleSelection = (id) => {
      setSelectedIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const toggleAll = () => {
      if (selectedIds.size === processedIncidents.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(processedIncidents.map(i => i.id)));
      }
  };

  const handleBulkAction = (type, payload = {}) => {
      submitBulkAction({ incidentIds: Array.from(selectedIds), type, payload });
      setSelectedIds(new Set());
  };

  const loading = status === "idle" || status === "loading";
  const hasSelected = !!selectedId;
  const activeTab = queueFilter.recurringOnly ? "recurring" : queueFilter.severity;

  const handleTabClick = (tab) => {
    if (tab === "all") setQueueFilter({ severity: "all", recurringOnly: false });
    else if (tab === "recurring") setQueueFilter({ severity: "all", recurringOnly: true });
    else setQueueFilter({ severity: tab, recurringOnly: false });
  };

  const applyPreset = (preset) => {
      if (preset === "escalation") setQueueFilter({ status: "open", severity: "high", search: "" });
      if (preset === "unassigned") setQueueFilter({ status: "open", severity: "high", search: "" }); // Ideally would filter by unassigned
      if (preset === "my") setQueueFilter({ search: myAssigneeLabel });
  };

  const clearAllFilters = () => setQueueFilter({ search: "", severity: "all", recurringOnly: false, coach: "all", train: "all", status: "open" });
  const closeBrief = () => {
    setFocusedIndex(-1);
    clearSelected();
  };

  return (
    <div className="flex flex-1 overflow-hidden">
        <PrintableReport incidents={processedIncidents} />
      {/* ── Queue list panel ── */}
      <div className={cn("flex flex-col border-r border-border bg-background/50 overflow-hidden transition-all duration-200 relative",
        hasSelected ? "w-[45%] hidden lg:flex" : "flex-1"
      )}>
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-border space-y-4 shrink-0 bg-card/20 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-bold text-lg font-display tracking-tight flex items-center gap-2">
                  Incident Queue
                  {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </h1>
              {status === "loaded" && <p className="text-xs text-muted-foreground font-medium">{displayRows.length} of {raw.length} incidents</p>}
            </div>
            
            <div className="flex items-center gap-2">
                {isAdmin && (
                    <button onClick={() => setIsGrouped(!isGrouped)} className={cn("inline-flex items-center gap-1.5 text-xs font-bold border rounded-xl px-3 h-8 transition-colors", isGrouped ? "bg-primary/20 text-primary border-primary/30" : "bg-muted border-border text-muted-foreground hover:text-foreground")}>
                        <Layers className="w-3.5 h-3.5" /> Group by Problem
                      </button>
                  )}
                  <ExportMenu incidents={processedIncidents} />
                <button type="button" onClick={fetchIncidents} disabled={loading}
                    className="inline-flex items-center gap-1.5 text-xs font-bold border border-border rounded-xl px-3 h-8 bg-muted hover:bg-muted hover:bg-muted transition-colors disabled:opacity-50">
                    <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                    Sync
                </button>
            </div>
          </div>
          
          {/* Admin Presets */}
          {isAdmin && (
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-1">Presets</span>
                  <button onClick={() => applyPreset("escalation")} className="text-xs font-semibold bg-red-500/10 text-red-600  border border-red-500/20 px-2.5 py-1 rounded-md whitespace-nowrap hover:bg-red-500/20 transition-colors"><Flame className="w-3 h-3 inline mr-1" />Needs Escalation</button>
                  <button onClick={() => applyPreset("unassigned")} className="text-xs font-semibold bg-amber-500/10 text-amber-600  border border-amber-500/20 px-2.5 py-1 rounded-md whitespace-nowrap hover:bg-amber-500/20 transition-colors">High Sev, Unassigned</button>
                  <button onClick={() => applyPreset("my")} className="text-xs font-semibold bg-blue-500/10 text-blue-600  border border-blue-500/20 px-2.5 py-1 rounded-md whitespace-nowrap hover:bg-blue-500/20 transition-colors">My Assigned</button>
              </div>
          )}

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search ID, train, coach, summary… (Press '/' to focus)"
              value={queueFilter.search}
              onChange={e => setQueueFilter({ search: e.target.value })}
              className="w-full h-10 pl-9 pr-10 text-sm font-medium border border-border rounded-xl bg-background/60 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {queueFilter.search && (
              <button type="button" onClick={() => setQueueFilter({ search: "" })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Active Filters */}
          {(queueFilter.coach !== "all" || queueFilter.train !== "all" || queueFilter.status !== "open") && (
            <div className="flex gap-2 text-[11px] font-bold flex-wrap">
              {queueFilter.coach !== "all" && (
                <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md border border-primary/20">
                  <Filter className="w-3 h-3" /> Coach: {queueFilter.coach}
                  <button onClick={() => setQueueFilter({ coach: "all" })} className="ml-1 opacity-70 hover:opacity-100"><X className="w-3 h-3"/></button>
                </div>
              )}
              {queueFilter.train !== "all" && (
                <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md border border-primary/20">
                  <Filter className="w-3 h-3" /> Train: {queueFilter.train}
                  <button onClick={() => setQueueFilter({ train: "all" })} className="ml-1 opacity-70 hover:opacity-100"><X className="w-3 h-3"/></button>
                </div>
              )}
              {queueFilter.status !== "open" && (
                <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md border border-primary/20">
                  Status: {queueFilter.status}
                  <button onClick={() => setQueueFilter({ status: "open" })} className="ml-1 opacity-70 hover:opacity-100"><X className="w-3 h-3"/></button>
                </div>
              )}
              <button onClick={clearAllFilters} className="text-muted-foreground hover:text-foreground underline underline-offset-2 ml-2">Clear all</button>
            </div>
          )}

          {/* Severity & Recurrence Tabs */}
          <div className="flex bg-muted p-1 rounded-xl border border-border overflow-x-auto hide-scrollbar">
            {[
              { id: "all", label: "All" },
              { id: "high", label: "High" },
              { id: "medium", label: "Med" },
              { id: "low", label: "Low" },
              { id: "recurring", label: "Recurring" }
            ].map(tab => (
              <button key={tab.id} onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm ring-1 ring-white/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:bg-muted/80"
                )}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Action Bar (Admin) */}
        <AnimatePresence>
            {isAdmin && selectedIds.size > 0 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-primary/10 border-b border-primary/20 px-5 py-3 flex items-center justify-between z-10 shadow-sm">
                    <span className="text-sm font-bold text-primary">{selectedIds.size} selected</span>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-8 text-xs font-bold bg-background/50 border-border" onClick={() => handleBulkAction("assignMaintenance", { assignee: myAssigneeLabel })}>Assign to me</Button>
                        <Button size="sm" variant="destructive" className="h-8 text-xs font-bold" onClick={() => handleBulkAction("escalate")}>Escalate</Button>
                        <button onClick={() => setSelectedIds(new Set())} className="ml-2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Table header */}
        {!loading && (
          <div className={cn("grid gap-x-3 px-5 py-2.5 border-b border-border shrink-0 bg-card backdrop-blur-sm", isAdmin ? "grid-cols-[20px_16px_1fr_100px_80px]" : "grid-cols-[16px_1fr_100px_80px]")}>
            {isAdmin && (
                <button onClick={toggleAll} className="flex items-center justify-center opacity-70 hover:opacity-100">
                    <CheckSquare className="w-4 h-4 text-muted-foreground" />
                </button>
            )}
            <div />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Incident</span>
            </div>
            <SortBtn label="STATUS" col="status" sorting={{ _col: sortCol, _dir: sortDir }} onSort={handleSort} />
            <SortBtn label="AGE" col="age" sorting={{ _col: sortCol, _dir: sortDir }} onSort={handleSort} />
          </div>
        )}

        {/* Rows */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-5 space-y-3">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse border border-border" />)}
            </div>
          ) : displayRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4 border border-border">
                <Filter className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">No incidents match your criteria.</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Try adjusting your filters or search term.</p>
              <button onClick={clearAllFilters}
                className="text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/5 pb-20">
              <AnimatePresence initial={false}>
              {displayRows.map((inc, i) => {
                if (inc._isGroup) {
                    const isExpanded = expandedGroups.has(inc.groupId);
                    return (
                        <motion.div key={`group-${inc.groupId}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="bg-card border-l-2 border-l-primary hover:bg-black/20 hover:bg-muted transition-colors cursor-pointer px-5 py-3 flex items-center justify-between"
                            onClick={() => toggleGroup(inc.groupId)}>
                            <div className="flex items-center gap-3">
                                <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                                <Layers className="w-4 h-4 text-primary" />
                                <div>
                                    <div className="text-sm font-bold">Train {inc.train} · Coach {inc.coach}</div>
                                    <div className="text-xs font-medium text-muted-foreground">{inc.summary}</div>
                                </div>
                            </div>
                            <div className="text-xs font-black bg-primary/20 text-primary px-2 py-1 rounded-full">{inc.count} linked</div>
                        </motion.div>
                    );
                }

                const isSelected = inc.id === selectedId;
                const isFocused = i === focusedIndex;
                const isChecked = selectedIds.has(inc.id);

                return (
                  <motion.div
                    key={inc.id}
                    layout="position"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="relative group"
                  >
                  <button
                    type="button"
                    onClick={(e) => {
                        if (e.target.closest('.checkbox-click-area') || e.target.closest('.quick-action-btn')) return;
                        setFocusedIndex(i);
                        selectIncident(inc.id);
                    }}
                    className={cn(
                      "w-full grid gap-x-3 px-5 py-4 text-left transition-all outline-none",
                      isAdmin ? "grid-cols-[20px_16px_1fr_100px_80px]" : "grid-cols-[16px_1fr_100px_80px]",
                      "hover:bg-muted/80 hover:bg-muted/80",
                      isSelected ? "bg-primary/5 hover:bg-primary/10" : "",
                      isFocused && !isSelected ? "bg-white/5" : "",
                      inc._isChild ? "pl-8 bg-muted/50" : ""
                    )}
                  >
                    {/* Selection indicator line */}
                    {isSelected && (
                      <motion.div layoutId="active-row-indicator" className="absolute left-0 top-0 bottom-0 w-1 bg-primary z-10" />
                    )}
                    {/* Fallback severity line if not selected */}
                    {!isSelected && (
                      <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-[2px] opacity-30",
                        inc.severity === "high" ? "bg-red-500" :
                        inc.severity === "medium" ? "bg-amber-500" :
                        "bg-green-500"
                      )} />
                    )}

                    {/* Admin Checkbox */}
                    {isAdmin && (
                        <div className="flex justify-center pt-1 checkbox-click-area" onClick={(e) => { e.stopPropagation(); toggleSelection(inc.id); }}>
                            <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer", isChecked ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-white/40")}>
                                {isChecked && <CheckSquare className="w-3 h-3" />}
                            </div>
                        </div>
                    )}

                    {/* Severity dot or nesting icon */}
                    <div className="flex items-center justify-center pt-1">
                      {inc._isChild ? (
                          <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
                      ) : (
                          <div className={cn("w-2 h-2 rounded-full shrink-0 shadow-sm", SEV_BAR[inc.severity])} />
                      )}
                    </div>

                    {/* Main info */}
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <motion.span layoutId={`id-${inc.id}`} className="font-mono text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">{inc.id}</motion.span>
                        <motion.span layoutId={`badge-${inc.id}`} className={cn("text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border inline-block", SEV_BADGE[inc.severity])}>{inc.severity}</motion.span>
                        {inc.recurrenceCount > 1 && <span className={cn("text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border shadow-sm", SEV_BADGE.recur)}>{inc.recurrenceCount}× RECUR</span>}
                      </div>
                      <p className="text-sm font-medium leading-snug text-foreground/90 mb-1.5">{inc.summary}</p>
                      
                      {/* Sub-info row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                          <span className="bg-muted px-1.5 py-0.5 rounded-md border border-border">T {inc.train}</span>
                          <span className="bg-muted px-1.5 py-0.5 rounded-md border border-border">C {inc.coach}</span>
                        </span>
                        
                        {/* Assignment marker (TTE emphasis) */}
                        {!isAdmin && (
                            inc.assignee === myAssigneeLabel ? (
                                <span className="text-[10px] font-bold bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded-md border border-green-500/20 flex items-center gap-1"><UserCheck className="w-3 h-3"/> Mine</span>
                            ) : !inc.assignee ? (
                                <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-md border border-amber-500/20">Unassigned</span>
                            ) : null
                        )}

                        {/* Admin extra density */}
                        {isAdmin && inc.assignee && (
                            <span className="text-[10px] font-bold text-muted-foreground bg-black/5 px-1.5 py-0.5 rounded-md border border-border flex items-center gap-1"><User2 className="w-3 h-3"/> {inc.assignee}</span>
                        )}

                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-start pt-0.5 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground truncate bg-muted px-2 py-1 rounded-md border border-border shadow-sm">
                        {STATUS_LABEL[inc.currentStatus] ?? inc.currentStatus}
                      </span>
                    </div>

                    {/* Age */}
                    <div className="flex items-start pt-1 gap-1 text-[11px] font-bold text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      <span>{timeAgo(inc.filedAt)}</span>
                    </div>
                  </button>
                  
                  {/* Hover Quick Actions (Admin only) */}
                  {isAdmin && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-md rounded-lg p-1 border border-border shadow-lg z-20">
                          <button className="quick-action-btn p-1.5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-foreground transition-colors" title="Root Cause" onClick={(e) => { e.stopPropagation(); selectIncident(inc.id, "rootCause"); }}>
                              <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button className="quick-action-btn p-1.5 hover:bg-amber-500/20 rounded-md text-amber-500 transition-colors" title="Forecast" onClick={(e) => { e.stopPropagation(); selectIncident(inc.id, "forecast"); }}>
                              <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                          <button className="quick-action-btn p-1.5 hover:bg-green-500/20 rounded-md text-green-500 transition-colors" title="Verify Resolution" onClick={(e) => { e.stopPropagation(); selectIncident(inc.id, "verify"); }}>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                      </div>
                  )}

                  </motion.div>
                );
              })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* The panel must unmount on close. A deferred exit animation could leave
          an empty split column after the selection state was already cleared. */}
      {hasSelected && (
        <div className="hidden lg:flex flex-1 overflow-hidden bg-background shadow-2xl relative z-10">
          <IncidentBrief onClose={closeBrief} />
        </div>
      )}

      {/* ── Mobile fullscreen ── */}
      {hasSelected && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background overflow-auto">
          <IncidentBrief onClose={closeBrief} fullscreen />
        </div>
      )}
    </div>
  );
}


