import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { Button } from "@/components/ui/button.jsx";
import { BarChart2, TrendingUp, TrendingDown, Filter, RefreshCw, Layers, ShieldAlert, Clock, Target } from "lucide-react";
import { useStaffStore } from "@/store/staffStore.js";
import { ISSUE_TYPES } from "@/data/incidents.js";
import {
  getVolumeByPeriod, getRecurrenceLeaderboard, getIssueTypeBreakdown,
  getResolutionTimeDistribution, getVerificationOutcomeRate, getNetworkPatternSummary,
  filterIncidents,
} from "@/data/analyticsHelpers.js";
import { cn } from "@/lib/utils.js";

// -- Premium Design Tokens ------------------------------------------
const C = {
  high: "#ef4444", // Red-500
  medium: "#f59e0b", // Amber-500
  low: "#10b981", // Emerald-500
  held: "#10b981",
  failed: "#ef4444",
  pending: "#8b5cf6", // Violet-500
  grid: "currentColor",
  gridOp: 0.05,
  text: "currentColor",
  textOp: 0.5
};

const CHART_MARGIN = { top: 10, right: 10, left: -20, bottom: 0 };
const TICK_STYLE = { fontSize: 11, fill: C.text, opacity: C.textOp, fontWeight: 500 };

// -- Custom Recharts Tooltip ---------------------------------------
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-xl p-3 text-sm min-w-[140px] z-50 ring-1 ring-white/5">
        <div className="font-bold text-foreground mb-2 pb-2 border-b border-border/50">{label}</div>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={"tt-" + index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-muted-foreground font-medium capitalize">{entry.name}</span>
              </div>
              <span className="font-bold text-foreground tabular-nums">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// -- Bento Box Wrapper ---------------------------------------------
function BentoCard({ title, icon: Icon, subtitle, children, className, animDelay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: animDelay, duration: 0.5, type: "spring", bounce: 0.2 }}
      className={cn(
        "group relative flex flex-col bg-card/40 hover:bg-card/60 transition-colors border border-border/40 overflow-hidden rounded-[24px] shadow-sm hover:shadow-md",
        className
      )}
    >
      {/* Subtle top glare */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="px-6 pt-6 pb-2 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {Icon && <Icon className="w-4 h-4 text-primary" />}
            <h3 className="font-bold text-foreground tracking-tight">{title}</h3>
          </div>
          {subtitle && <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>}
        </div>
      </div>
      <div className="flex-1 p-6 pt-2">
        {children}
      </div>
    </motion.div>
  );
}

// -- Filter Bar ----------------------------------------------------
const PERIODS = [{ v: "7d", l: "7 Days" }, { v: "30d", l: "1 Month" }, { v: "90d", l: "3 Months" }];
function FilterBar({ period, setPeriod, severity, setSeverity, issueType, setIssueType }) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-card/30 border border-border/40 p-2 rounded-2xl backdrop-blur-md">
      <div className="flex bg-muted/50 rounded-xl p-1">
        {PERIODS.map(p => (
          <button key={p.v} type="button" onClick={() => setPeriod(p.v)}
            className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
              period === p.v ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
            )}>
            {p.l}
          </button>
        ))}
      </div>

      <div className="h-8 w-px bg-border/40 hidden sm:block" />

      <select value={severity} onChange={e => setSeverity(e.target.value)}
        className="h-9 px-4 text-xs font-medium border border-border/50 rounded-xl bg-background/50 hover:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-colors cursor-pointer">
        <option value="all">All Severities</option>
        <option value="high">High Priority</option>
        <option value="medium">Medium Priority</option>
        <option value="low">Low Priority</option>
      </select>

      <select value={issueType} onChange={e => setIssueType(e.target.value)}
        className="h-9 px-4 text-xs font-medium border border-border/50 rounded-xl bg-background/50 hover:bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-colors cursor-pointer">
        <option value="all">All Categories</option>
        {Object.entries(ISSUE_TYPES).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-2 px-3 text-xs font-medium text-muted-foreground">
        <Filter className="w-3.5 h-3.5" />
        Live Sync
      </div>
    </div>
  );
}

// -- Big KPI -------------------------------------------------------
function KpiHero({ label, value, delta, good, icon: Icon, delay }) {
  const up = parseFloat(delta) > 0;
  const TrendIcon = up ? TrendingUp : TrendingDown;
  const colorDelta = up ? (good === false ? "text-red-500 bg-red-500/10" : "text-emerald-500 bg-emerald-500/10") : (good === false ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10");
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="flex flex-col justify-between p-6 bg-card border border-border/40 rounded-[24px] shadow-sm relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 duration-500">
        <Icon className="w-16 h-16" />
      </div>
      <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 relative z-10">{label}</div>
      <div className="flex items-end gap-4 relative z-10">
        <div className="text-5xl font-black tabular-nums tracking-tighter">{value}</div>
        {delta && (
          <div className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold mb-1", colorDelta)}>
            <TrendIcon className="w-3.5 h-3.5" />
            {delta}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// -- Main Component ------------------------------------------------
export default function Analytics() {
  const incidents = useStaffStore((s) => s.incidents);
  const status = useStaffStore((s) => s.incidentsStatus);
  const fetchIncidents = useStaffStore((s) => s.fetchIncidents);

  const [period, setPeriod] = useState("30d");
  const [severity, setSeverity] = useState("all");
  const [issueType, setIssueType] = useState("all");

  const filtered = useMemo(() =>
    filterIncidents(incidents, { severity, issueType, trainId: "all", period }), [incidents, severity, issueType, period]
  );

  const volumeData    = useMemo(() => getVolumeByPeriod(filtered),           [filtered, period]);
  const leaderboard   = useMemo(() => getRecurrenceLeaderboard(filtered),     [filtered]);
  const issueBreakdown= useMemo(() => getIssueTypeBreakdown(filtered),        [filtered]);
  const resTimes      = useMemo(() => getResolutionTimeDistribution(filtered),         [filtered]);
  const verifyRate    = useMemo(() => getVerificationOutcomeRate(filtered),            [filtered]);
  const networkSummary= useMemo(() => getNetworkPatternSummary(filtered),      [filtered]);

  const totalIncidents = filtered.length;
  const highCount      = filtered.filter(i => i.severity === "high").length;
  const latestMonth    = volumeData[volumeData.length - 1] ?? {};
  const prevMonth      = volumeData[volumeData.length - 2] ?? {};
  const pctChange      = prevMonth.total > 0
    ? Math.round(((latestMonth.total - prevMonth.prevTotal) / prevMonth.prevTotal) * 100)
    : 0;

  const loading = status !== "loaded";

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-8 space-y-6 max-w-[1600px] mx-auto w-full bg-background/50">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <BarChart2 className="w-6 h-6" />
            </div>
            Command Center Analytics
          </h1>
          <p className="text-muted-foreground font-medium mt-2 max-w-xl">
            Real-time telemetry and pattern recognition across the railway fleet. 
            Currently monitoring <strong className="text-foreground">{totalIncidents}</strong> critical events.
          </p>
        </div>
        <Button size="lg" onClick={() => fetchIncidents()}
          className="font-bold shadow-lg shadow-primary/20 rounded-xl gap-2">
          <RefreshCw className="w-4 h-4" /> Sync Telemetry
        </Button>
      </div>

      <FilterBar period={period} setPeriod={setPeriod} severity={severity} setSeverity={setSeverity} issueType={issueType} setIssueType={setIssueType} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="h-40 bg-card rounded-[24px]" />
          <div className="h-40 bg-card rounded-[24px]" />
          <div className="h-40 bg-card rounded-[24px]" />
          <div className="md:col-span-2 h-96 bg-card rounded-[24px]" />
          <div className="h-96 bg-card rounded-[24px]" />
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiHero label="Total Exceptions" value={totalIncidents} delta={(pctChange > 0 ? "+" : "") + pctChange + "%"} good={false} icon={Target} delay={0.1} />
            <KpiHero label="Critical Severity" value={highCount} icon={ShieldAlert} delay={0.2} />
            <KpiHero label="Chronic Coaches" value={leaderboard.filter(l => l.count > 3).length} icon={Layers} delay={0.3} />
            <KpiHero label="Q.C. Passed" value={verifyRate[verifyRate.length-1]?.held ?? 0} icon={Clock} delay={0.4} />
          </div>

          {/* Bento Grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-[420px]">
            
            {/* 1. Volume Trend (Spans 8 columns) */}
            <BentoCard title="Exception Velocity" subtitle="Incident volume trended by severity tier" icon={TrendingUp} className="lg:col-span-8" animDelay={0.4}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={volumeData} margin={CHART_MARGIN}>
                  <defs>
                    <linearGradient id="gHigh" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.high} stopOpacity={0.5} />
                      <stop offset="95%" stopColor={C.high} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gMed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.medium} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={C.medium} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gLow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.low} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.low} stopOpacity={0} />
                    </linearGradient>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.2" />
                    </filter>
                  </defs>
                  <CartesianGrid stroke={C.grid} strokeOpacity={C.gridOp} vertical={false} />
                  <XAxis dataKey="month" tick={TICK_STYLE} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: C.text, strokeOpacity: 0.1, strokeWidth: 2, strokeDasharray: "4 4" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 20 }} />
                  <Area type="monotone" dataKey="low" name="Low Priority" stroke={C.low} fill="url(#gLow)" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="medium" name="Medium Priority" stroke={C.medium} fill="url(#gMed)" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="high" name="High Priority" stroke={C.high} fill="url(#gHigh)" strokeWidth={3} filter="url(#shadow)" dot={{ r: 0 }} activeDot={{ r: 8, stroke: "white", strokeWidth: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </BentoCard>

            {/* 2. Issue Radar (Spans 4 columns) */}
            <BentoCard title="Risk Topology" subtitle="Distribution across category vectors" icon={Target} className="lg:col-span-4" animDelay={0.5}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={issueBreakdown.map(d => ({ subject: d.label, A: d.count, fullMark: totalIncidents }))}>
                  <PolarGrid stroke={C.grid} strokeOpacity={C.gridOp} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: C.text, fontSize: 11, fontWeight: 600, opacity: 0.8 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Radar name="Incidents" dataKey="A" stroke="hsl(var(--primary))" strokeWidth={3} fill="hsl(var(--primary))" fillOpacity={0.2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                </RadarChart>
              </ResponsiveContainer>
            </BentoCard>

            {/* 3. Resolution SLA (Spans 6 columns) */}
            <BentoCard title="Resolution SLA Matrix" subtitle="Time-to-close segmented by severity" icon={Clock} className="lg:col-span-6" animDelay={0.6}>
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resTimes} margin={CHART_MARGIN} barGap={4}>
                  <CartesianGrid stroke={C.grid} strokeOpacity={C.gridOp} vertical={false} />
                  <XAxis dataKey="label" tick={TICK_STYLE} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: C.text, opacity: 0.05 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 20 }} />
                  <Bar dataKey="high" name="High Priority" fill={C.high} radius={[6, 6, 6, 6]} maxBarSize={16} />
                  <Bar dataKey="medium" name="Medium Priority" fill={C.medium} radius={[6, 6, 6, 6]} maxBarSize={16} />
                  <Bar dataKey="low" name="Low Priority" fill={C.low} radius={[6, 6, 6, 6]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </BentoCard>

             {/* 4. Quality Control (Spans 6 columns) */}
             <BentoCard title="Quality Control Outcomes" subtitle="Verification pass/fail rates over time" icon={ShieldAlert} className="lg:col-span-6" animDelay={0.7}>
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={verifyRate} margin={CHART_MARGIN}>
                  <CartesianGrid stroke={C.grid} strokeOpacity={C.gridOp} vertical={false} />
                  <XAxis dataKey="month" tick={TICK_STYLE} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: C.text, opacity: 0.05 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 20 }} />
                  <Bar dataKey="held" name="Passed Q.C." fill={C.held} radius={[0, 0, 4, 4]} maxBarSize={32} stackId="v" />
                  <Bar dataKey="pending" name="Pending Review" fill={C.pending} radius={[0, 0, 0, 0]} maxBarSize={32} stackId="v" />
                  <Bar dataKey="failed" name="Failed & Re-opened" fill={C.failed} radius={[4, 4, 0, 0]} maxBarSize={32} stackId="v" />
                </BarChart>
              </ResponsiveContainer>
            </BentoCard>

            {/* 5. Network Risk List (Spans 12 columns) */}
            <BentoCard title="Network Risk Register" subtitle="Chronic asset failure ranking (Top 10)" icon={Layers} className="lg:col-span-12 h-auto min-h-[420px]" animDelay={0.8}>
               <div className="flex-1 min-h-0 overflow-y-auto p-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                {networkSummary.slice(0, 9).map((t, i) => {
                  const maxScore = networkSummary[0]?.riskScore || 1;
                  const pct = Math.round((t.riskScore / maxScore) * 100);
                  const barColor = pct > 66 ? "bg-red-500 shadow-red-500/50" : pct > 33 ? "bg-amber-500 shadow-amber-500/50" : "bg-emerald-500 shadow-emerald-500/50";
                  return (
                    <motion.div key={t.train}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 + 0.9, type: "spring", bounce: 0 }}
                      className="flex flex-col gap-3 p-4 rounded-2xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-lg font-black tracking-tight">{t.train}</div>
                          <div className="text-xs text-muted-foreground font-medium truncate max-w-[180px]">{t.name}</div>
                        </div>
                        <div className={"px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm " + (pct > 66 ? "bg-red-500/10 text-red-500" : pct > 33 ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500")}>
                          Risk: {pct}%
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="h-2.5 bg-background rounded-full overflow-hidden p-0.5 border border-border/50">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: pct + "%" }} transition={{ delay: i * 0.05 + 1.2, duration: 0.8, ease: "easeOut" }}
                          className={"h-full rounded-full shadow-md " + barColor}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center pt-2">
                         <div className="bg-background rounded-lg p-2 border border-border/40">
                          <div className="font-black text-foreground">{t.total}</div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase">Total</div>
                        </div>
                        <div className="bg-background rounded-lg p-2 border border-border/40">
                          <div className="font-black text-amber-500">{t.recurring}</div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase">Recur</div>
                        </div>
                        <div className="bg-background rounded-lg p-2 border border-border/40">
                          <div className="font-black text-red-500">{t.highSev}</div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase">High</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            </BentoCard>

          </div>
        </>
      )}
    </div>
  );
}





