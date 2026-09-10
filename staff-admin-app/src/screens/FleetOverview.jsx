import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Ship, TrendingUp, RefreshCw, AlertTriangle, TrainFront, ShieldAlert, Clock, Filter, Grid2X2 } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { useStaffStore } from "@/store/staffStore.js";
import { getTrainRiskScore, getTrainSparkline, getHeatmapData, TRAIN_COMPOSITIONS, getCoachClass } from "@/data/incidents.js";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils.js";

const SEV_COLORS = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-green-500" };

function Sparkline({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = 0;
  
  // Normalize to 0-100 height
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / (max - min)) * 100;
    return `${x},${y}`;
  }).join(" ");

  const isUp = data[data.length-1] > data[0];
  const color = isUp ? "#ef4444" : "#22c55e"; // Red if trending worse, green if better

  return (
    <svg viewBox="0 0 100 100" className="w-16 h-6 overflow-visible preserve-3d">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RiskBadge({ score }) {
  const level = score >= 75 ? "CRITICAL" : score >= 40 ? "HIGH" : score >= 15 ? "MEDIUM" : "LOW";
  const cls = score >= 75 ? "bg-red-500/10 text-red-600 border-red-500/20" :
              score >= 40 ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
              score >= 15 ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" :
                            "bg-green-500/10 text-green-600 border-green-500/20";
                            
  return (
    <div className="flex flex-col items-end">
      <div className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border mb-1", cls)}>
        {level}
      </div>
      <div className="text-xs text-muted-foreground font-bold">Risk {score}/100</div>
    </div>
  );
}

export default function FleetOverview() {
  const navigate = useNavigate();
  const fetchIncidents = useStaffStore((s) => s.fetchIncidents);
  const incidents = useStaffStore((s) => s.incidents);
  const status = useStaffStore((s) => s.incidentsStatus);
  const setQueueFilter = useStaffStore((s) => s.setQueueFilter);

  const [activeTab, setActiveTab] = useState("physical"); // physical | heatmap
  const [search, setSearch] = useState("");
  
  // Heatmap state
  const [heatmapGroup, setHeatmapGroup] = useState("coach"); // coach | class
  const [heatmapDays, setHeatmapDays] = useState(30);

  useEffect(() => { if (status === "idle") fetchIncidents(); }, []);

  const loading = status !== "loaded";

  // Data processing for Physical View
  const physicalTrains = useMemo(() => {
    if (!incidents) return [];
    
    // Group by train
    const trainMap = {};
    incidents.forEach(inc => {
      if (!trainMap[inc.train]) {
        trainMap[inc.train] = { 
          train: inc.train, 
          trainName: inc.trainName, 
          incidents: [], 
          score: 0,
          sparkline: []
        };
      }
      trainMap[inc.train].incidents.push(inc);
    });

    const list = Object.values(trainMap).map(t => {
      t.score = getTrainRiskScore(t.train, incidents);
      t.sparkline = getTrainSparkline(t.train, incidents, 14);
      return t;
    });

    // Sort by risk score desc
    list.sort((a,b) => b.score - a.score);

    if (search) {
      const q = search.toLowerCase();
      return list.filter(t => t.train.includes(q) || t.trainName?.toLowerCase().includes(q));
    }
    return list;
  }, [incidents, search]);

  // Data processing for Heatmap View
  const heatmapData = useMemo(() => {
    if (!incidents) return [];
    return getHeatmapData(incidents, heatmapGroup, heatmapDays);
  }, [incidents, heatmapGroup, heatmapDays]);

  // Unique columns for heatmap header
  const heatmapCols = useMemo(() => {
    const cols = new Set();
    heatmapData.forEach(row => Object.keys(row.cells).forEach(c => cols.add(c)));
    return Array.from(cols).sort();
  }, [heatmapData]);

  const navToQueue = (train, coach = null) => {
    setQueueFilter({ train: train, coach: coach || "all", search: "", status: "open", severity: "all", recurringOnly: false });
    navigate("/queue");
  };
  
  const navToQueueByClass = (coachClass) => {
    // There is no native class filter in the queue yet, but we can search for class keywords if needed.
    // For now, navigating to all incidents matching a physical condition requires multiple coach selects, which is unsupported.
    // We'll just reset queue and rely on search or show a toast. For now, navigate to queue without specific coach.
    setQueueFilter({ train: "all", coach: "all", search: coachClass, status: "open" });
    navigate("/queue");
  };

  return (
    <div className="overflow-auto flex-1 p-6 lg:p-10 space-y-8 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display tracking-tight flex items-center gap-3">
            <Ship className="w-8 h-8 text-primary" /> Fleet Operations
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Cross-dimensional pattern detection and coach health</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted p-1 rounded-xl border border-border">
            <button onClick={() => setActiveTab("physical")} className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", activeTab === "physical" ? "bg-background shadow-sm ring-1 ring-white/10" : "text-muted-foreground hover:bg-white/5")}>Physical View</button>
            <button onClick={() => setActiveTab("heatmap")} className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", activeTab === "heatmap" ? "bg-background shadow-sm ring-1 ring-white/10" : "text-muted-foreground hover:bg-white/5")}>Heatmap Matrix</button>
          </div>
          <button onClick={fetchIncidents}
            className="inline-flex items-center gap-2 text-xs font-bold border border-border rounded-xl px-4 py-2 hover:bg-white/5 transition-colors shadow-sm bg-muted">
            <RefreshCw className="w-4 h-4" /> Sync
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "physical" ? (
          <motion.div key="physical" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 bg-card/40 backdrop-blur-md p-4 rounded-2xl border border-border shadow-lg shadow-black/5">
              <input type="text" placeholder="Search trains..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-64 h-9 px-4 text-sm font-medium bg-background/60 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> Critical / High</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> Warning</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-white/10 border border-border" /> Healthy</div>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-muted/50 rounded-2xl animate-pulse" />)}</div>
            ) : physicalTrains.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground font-semibold">No trains match your search.</div>
            ) : (
              <div className="space-y-4">
                {physicalTrains.map(t => {
                  const comp = TRAIN_COMPOSITIONS[t.train] || TRAIN_COMPOSITIONS.default;
                  
                  return (
                    <div key={t.train} className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-5 shadow-lg shadow-black/5 flex flex-col gap-4">
                      {/* Train Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <TrainFront className="w-5 h-5 text-primary" />
                            <h3 className="text-xl font-black font-display">{t.train}</h3>
                            <span className="text-sm font-semibold text-muted-foreground">{t.trainName}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="text-xs font-bold text-muted-foreground">Open Incidents: <span className="text-foreground">{t.incidents.length}</span></div>
                            <div className="w-px h-3 bg-white/10" />
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-muted-foreground">14-Day Trend:</span>
                              <Sparkline data={t.sparkline} />
                            </div>
                          </div>
                        </div>
                        <RiskBadge score={t.score} />
                      </div>

                      {/* Coach Strip */}
                      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        {comp.map((c, i) => {
                          const coachIncs = t.incidents.filter(inc => inc.coach === c && inc.status !== "resolved");
                          const hasHigh = coachIncs.some(inc => inc.severity === "high");
                          const hasMed = coachIncs.some(inc => inc.severity === "medium");
                          
                          const bg = hasHigh ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)] text-white" : 
                                     hasMed ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)] text-white" : 
                                     "bg-card text-muted-foreground border border-border hover:border-border";

                          return (
                            <button key={`${c}-${i}`} onClick={() => navToQueue(t.train, c)}
                              className="group relative flex-shrink-0 flex flex-col items-center gap-1 transition-transform hover:-translate-y-1"
                            >
                              <div className={cn("w-14 h-16 rounded-xl flex items-center justify-center font-bold text-sm transition-colors", bg)}>
                                {c}
                              </div>
                              {coachIncs.length > 0 && (
                                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center text-[10px] font-black shadow-lg">
                                  {coachIncs.length}
                                </div>
                              )}
                              
                              {/* Hover Tooltip */}
                              <div className="absolute top-full mt-2 w-48 bg-card border border-border p-3 rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                                <div className="text-xs font-bold mb-2">Coach {c}</div>
                                {coachIncs.length === 0 ? (
                                  <div className="text-[10px] text-muted-foreground">No open incidents</div>
                                ) : (
                                  <div className="space-y-1.5">
                                    {coachIncs.slice(0,2).map(inc => (
                                      <div key={inc.id} className="text-[10px] bg-card p-1.5 rounded truncate">
                                        <span className={cn("inline-block w-2 h-2 rounded-full mr-1.5", SEV_COLORS[inc.severity])} />
                                        {inc.summary}
                                      </div>
                                    ))}
                                    {coachIncs.length > 2 && <div className="text-[9px] font-bold text-muted-foreground mt-1">+{coachIncs.length-2} more incidents</div>}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="heatmap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-card/40 backdrop-blur-md p-4 rounded-2xl border border-border shadow-lg shadow-black/5">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest"><Grid2X2 className="inline w-4 h-4 mr-1"/> X-Axis Grouping:</span>
                <div className="flex bg-muted p-1 rounded-lg border border-border">
                  <button onClick={() => setHeatmapGroup("coach")} className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", heatmapGroup === "coach" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>Physical Coach</button>
                  <button onClick={() => setHeatmapGroup("class")} className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all", heatmapGroup === "class" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>Coach Class</button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest"><Clock className="inline w-4 h-4 mr-1"/> Range:</span>
                <div className="flex bg-muted p-1 rounded-lg border border-border">
                  {[7, 14, 30].map(d => (
                    <button key={d} onClick={() => setHeatmapDays(d)} className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-all tabular-nums", heatmapDays === d ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>{d} Days</button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="h-96 bg-muted/50 rounded-2xl animate-pulse" />
            ) : heatmapData.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground font-semibold">No incidents in this timeframe.</div>
            ) : (
              <div className="bg-card/40 backdrop-blur-md border border-border rounded-2xl shadow-lg overflow-x-auto p-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="p-4 border-b border-border font-display font-black text-sm text-muted-foreground w-48 sticky left-0 bg-card/80 backdrop-blur z-20">Train / Route</th>
                      {heatmapCols.map(c => (
                        <th key={c} className="p-3 border-b border-border text-xs font-bold text-center w-16">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapData.map((row, i) => (
                      <tr key={row.train} className="border-b border-border hover:bg-white/5 transition-colors group">
                        <td className="p-3 sticky left-0 bg-card/80 backdrop-blur group-hover:bg-card z-10">
                          <div className="font-bold text-sm">{row.train}</div>
                          <div className="text-[10px] text-muted-foreground truncate w-40">{row.trainName} · {row.route}</div>
                        </td>
                        {heatmapCols.map(c => {
                          const cell = row.cells[c];
                          const bg = !cell ? "bg-transparent" :
                                     cell.topSeverity === "high" ? `bg-red-500/${Math.min(20 + cell.count*15, 100)}` :
                                     cell.topSeverity === "medium" ? `bg-amber-500/${Math.min(20 + cell.count*15, 100)}` :
                                     `bg-green-500/${Math.min(20 + cell.count*15, 100)}`;
                          
                          const text = !cell ? "text-transparent" :
                                       cell.topSeverity === "high" ? "text-red-600 " :
                                       cell.topSeverity === "medium" ? "text-amber-600 " :
                                       "text-green-600 ";

                          return (
                            <td key={c} className="p-1">
                              {cell ? (
                                <button onClick={() => heatmapGroup === "coach" ? navToQueue(row.train, c) : navToQueueByClass(c)}
                                  title={`${cell.count} incidents — ${cell.lastIssueType}`}
                                  className={cn("w-full h-10 rounded-md flex items-center justify-center font-black text-xs transition-transform hover:scale-110", bg, text)}
                                >
                                  {cell.count}
                                </button>
                              ) : (
                                <div className="w-full h-10 rounded-md bg-muted opacity-50" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}