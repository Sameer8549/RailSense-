import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip as RechartsTooltip, PieChart, Pie } from "recharts";
import { AlertTriangle, ListChecks, CheckCircle2, TrendingUp, RefreshCw, ChevronRight, ArrowRight, ShieldAlert, TrainFront, Filter, X, Download, Sparkles } from "lucide-react";
import { useStaffStore } from "@/store/staffStore.js";
import { getDashboardStatsWithDeltas, getHotspots, generateInsightNarrative, getVolumeTrendData, getFilteredIncidents, TRAIN_ROUTES, ISSUE_TYPES } from "@/data/incidents.js";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils.js";
import { Button } from "@/components/ui/button.jsx";

const SEV_BADGE = {
  high:   "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20  dark:border-red-500/30",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20  dark:border-amber-500/30",
  low:    "bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/20  dark:border-green-500/30",
};

const CHART_COLORS = { High: "#ef4444", Medium: "#f59e0b", Low: "#22c55e" };

function KPICard({ label, value, delta, icon: Icon, sub, accent, loading, index, onClick }) {
  const isUp = delta > 0;
  const isFlat = delta === 0;
  // Determine if UP is good or bad. For resolved, UP is good. For others, UP is bad.
  const isPositiveMetric = label === "Resolved Today" || label === "Resolved in Period";
  const deltaColor = isFlat ? "text-muted-foreground" : (isUp === isPositiveMetric ? "text-green-500" : "text-red-500");

  return (
    <motion.button 
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", bounce: 0, duration: 0.35 }}
      className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-5 flex items-start gap-5 shadow-lg shadow-black/5 text-left hover:bg-card/60 transition-colors w-full group"
    >
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-border shadow-inner transition-transform group-hover:scale-105", accent)}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest truncate">{label}</div>
        {loading
          ? <div className="h-10 w-20 mt-1 bg-muted/50 rounded animate-pulse" />
          : (
            <div className="flex items-end gap-3 mt-1.5">
              <div className="text-4xl font-black font-display tracking-tight leading-none">{value}</div>
              {delta !== undefined && (
                <div className={cn("text-sm font-black flex items-center mb-1", deltaColor)}>
                  {isUp ? '▲' : isFlat ? '-' : '▼'} {Math.abs(delta)}%
                </div>
              )}
            </div>
          )
        }
        {sub && <div className="text-xs font-medium text-muted-foreground mt-2 truncate">{sub}</div>}
      </div>
    </motion.button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const fetchIncidents = useStaffStore((s) => s.fetchIncidents);
  const incidents = useStaffStore((s) => s.incidents);
  const status = useStaffStore((s) => s.incidentsStatus);
  const selectIncident = useStaffStore((s) => s.selectIncident);
  const setQueueFilter = useStaffStore((s) => s.setQueueFilter);
  const clearSelected = useStaffStore((s) => s.clearSelected);
  
  const dashboardFilter = useStaffStore((s) => s.dashboardFilter);
  const setDashboardFilter = useStaffStore((s) => s.setDashboardFilter);
  const clearDashboardFilter = useStaffStore((s) => s.clearDashboardFilter);

  useEffect(() => { if (status === "idle") fetchIncidents(); }, []);

  const loading = status !== "loaded";

  const statsWithDeltas = useMemo(() => {
    if (!incidents || incidents.length === 0) return null;
    return getDashboardStatsWithDeltas(incidents, dashboardFilter);
  }, [incidents, dashboardFilter]);

  const filteredIncidents = statsWithDeltas?.filteredIncidents ?? [];
  const stats = statsWithDeltas;
  const hotspots = useMemo(() => getHotspots(filteredIncidents), [filteredIncidents]);
  
  const narrativeInsight = useMemo(() => {
    if (!stats) return "Loading data...";
    return generateInsightNarrative(stats, dashboardFilter);
  }, [stats, dashboardFilter]);

  const volumeTrendData = useMemo(() => {
    if (!incidents) return [];
    return getVolumeTrendData(incidents, dashboardFilter, dashboardFilter.dateRange === "all" ? 30 : dashboardFilter.dateRange, true);
  }, [incidents, dashboardFilter]);

  // Hero: highest recurrence
  const topHotspot = hotspots.length > 0 ? hotspots[0] : null;
  // Watchlist: next highest, focusing on count > 1
  const watchlist = hotspots.filter(h => h.count > 1).slice(1, 5);

  const chartData = stats?.severityBreakdown ?? [];
  const barData = hotspots.slice(0, 10).map(h => ({
    name: `C ${h.coach}`,
    coach: h.coach,
    train: h.train,
    value: h.count
  }));

  const navToQueue = (filterArgs = {}) => {
    clearSelected();
    // Merge dashboard filters with any specific arguments for drilldown
    const base = {
      search: "",
      period: dashboardFilter.dateRange === "all" ? "all" : `${dashboardFilter.dateRange}d`,
      train: dashboardFilter.train,
      severity: dashboardFilter.severity,
      status: "open",
      coach: "all",
      recurringOnly: false
    };
    setQueueFilter({ ...base, ...filterArgs });
    navigate("/queue");
  };

  const exportCSV = () => {
    if (!filteredIncidents.length) return;
    const header = ["ID", "Train", "Coach", "Severity", "Status", "Issue Types", "Summary", "Filed At"];
    const rows = filteredIncidents.map(inc => [
      inc.id, inc.train, inc.coach, inc.severity, inc.status, inc.issueTypes.join(";"), `"${inc.summary.replace(/"/g, '""')}"`, inc.filedAt
    ]);
    const csvContent = [header.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `railsense_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="overflow-auto flex-1 p-6 lg:p-10 space-y-8 max-w-[1400px] mx-auto w-full">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display tracking-tight">Command Center</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Predictive analysis and live incident triage</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} disabled={loading || filteredIncidents.length === 0}
            className="inline-flex items-center gap-2 text-xs font-bold border border-border rounded-xl px-4 py-2 hover:bg-white/5 transition-colors shadow-sm bg-muted disabled:opacity-50">
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button onClick={fetchIncidents}
            className="inline-flex items-center gap-2 text-xs font-bold border border-border rounded-xl px-4 py-2 hover:bg-white/5 transition-colors shadow-sm bg-muted backdrop-blur-md">
            <RefreshCw className="w-4 h-4" /> Sync Data
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-card/40 backdrop-blur-md p-4 rounded-2xl border border-border shadow-lg shadow-black/5 flex flex-wrap items-center gap-4 relative z-20">
        <div className="flex items-center gap-2 mr-2">
          <Filter className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm tracking-tight">Filters</span>
        </div>
        
        <select value={dashboardFilter.dateRange} onChange={e => setDashboardFilter({ dateRange: e.target.value === "all" ? "all" : Number(e.target.value) })}
          className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
          <option value={7}>Last 7 Days</option>
          <option value={14}>Last 14 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={60}>Last 60 Days</option>
          <option value="all">All Time</option>
        </select>

        <select value={dashboardFilter.route} onChange={e => setDashboardFilter({ route: e.target.value })}
          className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
          <option value="all">All Routes</option>
          {Array.from(new Set(Object.values(TRAIN_ROUTES))).map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select value={dashboardFilter.train} onChange={e => setDashboardFilter({ train: e.target.value })}
          className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
          <option value="all">All Trains</option>
          {Object.keys(TRAIN_ROUTES).map(t => <option key={t} value={t}>{t} - {TRAIN_ROUTES[t]}</option>)}
        </select>

        <select value={dashboardFilter.severity} onChange={e => setDashboardFilter({ severity: e.target.value })}
          className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
          <option value="all">All Severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select value={dashboardFilter.issueType} onChange={e => setDashboardFilter({ issueType: e.target.value })}
          className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
          <option value="all">All Issue Types</option>
          {Object.entries(ISSUE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Active Filter Chips */}
      {(dashboardFilter.dateRange !== 30 || dashboardFilter.route !== "all" || dashboardFilter.train !== "all" || dashboardFilter.severity !== "all" || dashboardFilter.issueType !== "all") && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-wrap items-center gap-2 -mt-4">
          {dashboardFilter.dateRange !== 30 && (
            <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
              {dashboardFilter.dateRange === "all" ? "All Time" : `Last ${dashboardFilter.dateRange} Days`}
              <button onClick={() => setDashboardFilter({ dateRange: 30 })} className="ml-1 hover:text-foreground"><X className="w-3 h-3" /></button>
            </div>
          )}
          {dashboardFilter.route !== "all" && (
            <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
              Route: {dashboardFilter.route}
              <button onClick={() => setDashboardFilter({ route: "all" })} className="ml-1 hover:text-foreground"><X className="w-3 h-3" /></button>
            </div>
          )}
          {dashboardFilter.train !== "all" && (
            <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
              Train: {dashboardFilter.train}
              <button onClick={() => setDashboardFilter({ train: "all" })} className="ml-1 hover:text-foreground"><X className="w-3 h-3" /></button>
            </div>
          )}
          {dashboardFilter.severity !== "all" && (
            <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
              Severity: {dashboardFilter.severity}
              <button onClick={() => setDashboardFilter({ severity: "all" })} className="ml-1 hover:text-foreground"><X className="w-3 h-3" /></button>
            </div>
          )}
          {dashboardFilter.issueType !== "all" && (
            <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
              Type: {ISSUE_TYPES[dashboardFilter.issueType]?.label}
              <button onClick={() => setDashboardFilter({ issueType: "all" })} className="ml-1 hover:text-foreground"><X className="w-3 h-3" /></button>
            </div>
          )}
          <button onClick={clearDashboardFilter} className="text-xs font-bold text-muted-foreground hover:text-foreground px-2 py-1 underline underline-offset-2">Clear all</button>
        </motion.div>
      )}

      {/* AI Narrative Insight */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start sm:items-center gap-4 shadow-inner">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">AI Insight</div>
          <div className="text-sm font-semibold leading-snug">{narrativeInsight}</div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard 
          label="Open Incidents" value={stats?.totalOpen ?? "–"} delta={stats?.deltas?.totalOpen} icon={ListChecks} sub="Currently open in filter" accent="bg-blue-500/20 text-blue-600 " loading={loading} index={0} 
          onClick={() => navToQueue()} 
        />
        <KPICard 
          label="High Severity" value={stats?.highSeverity ?? "–"} delta={stats?.deltas?.highSeverity} icon={AlertTriangle} sub="Requires immediate action" accent="bg-red-500/20 text-red-600 " loading={loading} index={1} 
          onClick={() => navToQueue({ severity: "high" })} 
        />
        <KPICard 
          label="Recurring Faults" value={hotspots.filter(h => h.count > 1).length} delta={0} icon={TrendingUp} sub="Coaches with multiple incidents" accent="bg-amber-500/20 text-amber-600 " loading={loading} index={2} 
          onClick={() => navToQueue({ recurringOnly: true })} 
        />
        <KPICard 
          label="Resolved in Period" value={stats?.resolvedToday ?? "–"} delta={stats?.deltas?.resolvedToday} icon={CheckCircle2} sub="Closed during filter period" accent="bg-green-500/20 text-green-600 " loading={loading} index={3} 
          onClick={() => navToQueue({ status: "resolved" })} 
        />
      </div>

      {/* Incident Volume Trend */}
      <div className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-6 shadow-lg shadow-black/5">
         <div className="text-lg font-bold font-display tracking-tight mb-1">Incident Volume Trend</div>
         <div className="text-xs font-medium text-muted-foreground mb-6">Historical actuals vs. 3-day projection</div>
         {loading ? (
            <div className="h-64 bg-muted/50 rounded-xl animate-pulse" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={volumeTrendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-5" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2}} contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff', fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="actual" name="Actual Incidents" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="projected" name="Projected" stroke="hsl(var(--primary))" strokeOpacity={0.4} strokeDasharray="5 5" strokeWidth={3} dot={false} activeDot={{ r: 6 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
      </div>

      {/* Secondary Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Watchlist */}
        <div className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-6 flex flex-col shadow-lg shadow-black/5 overflow-hidden relative">
          
          <div className="relative z-10">
            <div className="text-lg font-bold font-display tracking-tight mb-1 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              Secondary Watchlist
            </div>
            <div className="text-xs font-medium text-muted-foreground mb-6">Elevated risk within filtered scope</div>
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted/50 rounded-xl animate-pulse" />)}</div>
            ) : watchlist.length === 0 ? (
              <p className="text-sm font-medium text-muted-foreground py-8 text-center flex-1 flex items-center justify-center bg-muted rounded-xl border border-border">No secondary hotspots detected in this period.</p>
            ) : (
              <div className="space-y-2">
                {watchlist.map((h, i) => (
                  <button key={i} type="button"
                    onClick={() => navToQueue({ coach: h.coach, train: h.train })}
                    className="w-full flex items-center justify-between gap-4 p-3 hover:bg-white/5 rounded-xl border border-transparent hover:border-border transition-all text-left bg-muted shadow-inner"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold truncate">
                        Train {h.train} · Coach {h.coach}
                        <span className="ml-3 text-xs text-muted-foreground font-medium">{h.trainName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-black tabular-nums text-foreground w-8 text-right">{h.count}×</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Severity Donut */}
        <div className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-6 shadow-lg shadow-black/5">
          <div className="text-lg font-bold font-display tracking-tight mb-1">Severity Distribution</div>
          <div className="text-xs font-medium text-muted-foreground mb-6">Of filtered open incidents</div>
          {loading ? (
            <div className="h-52 bg-muted/50 rounded-xl animate-pulse" />
          ) : (
            <div className="h-52 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <RechartsTooltip cursor={false} contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff', fontWeight: 'bold' }} />
                  <Pie 
                    data={chartData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" cy="50%" 
                    innerRadius={60} 
                    outerRadius={80} 
                    stroke="none"
                    onClick={(entry) => navToQueue({ severity: entry.name.toLowerCase() })}
                    className="cursor-pointer outline-none"
                  >
                    {chartData.map((d) => <Cell key={d.name} fill={CHART_COLORS[d.name] ?? "#6b7280"} className="hover:opacity-80 transition-opacity outline-none" />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black font-display">{stats?.totalOpen ?? 0}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Complaint frequency by coach */}
      <div className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-6 shadow-lg shadow-black/5">
         <div className="text-lg font-bold font-display tracking-tight mb-1">Complaint Frequency by Coach</div>
         <div className="text-xs font-medium text-muted-foreground mb-6">Top 10 highest-volume coaches</div>
         {loading ? (
            <div className="h-64 bg-muted/50 rounded-xl animate-pulse" />
          ) : barData.length === 0 ? (
             <div className="h-64 flex items-center justify-center text-sm font-semibold text-muted-foreground">No data for selected filters.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-5" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.8)', color: '#fff', fontWeight: 'bold' }} />
                  <Bar dataKey="value" name="Incidents" radius={[4, 4, 0, 0]} maxBarSize={48} onClick={(entry) => navToQueue({ coach: entry.coach, train: entry.train })} className="cursor-pointer">
                    {barData.map((d, index) => <Cell key={index} fill="hsl(var(--primary))" className="hover:opacity-80 transition-opacity" />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
      </div>

    </div>
  );
}
