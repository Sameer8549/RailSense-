import { createPortal } from "react-dom";
import { Train } from "lucide-react";
import { Badge } from "@/components/ui/badge.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.jsx";

export function PrintableReport({ incidents }) {
  if (!incidents || incidents.length === 0) return null;

  const total = incidents.length;
  const high = incidents.filter(i => i.severity === "high").length;
  const med = incidents.filter(i => i.severity === "medium").length;
  const low = incidents.filter(i => i.severity === "low").length;
  
  const printDate = new Date().toLocaleString();

  return createPortal(
    <div className="hidden print:block print-report-container p-8 bg-white text-black min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-black pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center print-exact">
            <div className="w-7 h-7 bg-white" style={{ maskImage: "url(/logo.png)", WebkitMaskImage: "url(/logo.png)", maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center" }} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold font-display tracking-tight text-black m-0">RailSense</h1>
            <p className="text-sm font-bold uppercase tracking-widest text-black/60 m-0">Staff Operations Portal</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-black m-0">Filtered Incident Report</h2>
          <p className="text-sm text-black/60 m-0">Generated: {printDate}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="border border-black/20 rounded-lg p-4">
          <div className="text-xs font-bold uppercase text-black/60">Total Exported</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>
        <div className="border border-red-500/30 bg-red-50 rounded-lg p-4 print-exact">
          <div className="text-xs font-bold uppercase text-red-700">High Severity</div>
          <div className="text-2xl font-bold text-red-900">{high}</div>
        </div>
        <div className="border border-amber-500/30 bg-amber-50 rounded-lg p-4 print-exact">
          <div className="text-xs font-bold uppercase text-amber-700">Medium Severity</div>
          <div className="text-2xl font-bold text-amber-900">{med}</div>
        </div>
        <div className="border border-blue-500/30 bg-blue-50 rounded-lg p-4 print-exact">
          <div className="text-xs font-bold uppercase text-blue-700">Low Severity</div>
          <div className="text-2xl font-bold text-blue-900">{low}</div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-black/20 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-black/5 print-exact">
            <TableRow className="border-black/20">
              <TableHead className="font-bold text-black h-10">ID</TableHead>
              <TableHead className="font-bold text-black h-10">Category</TableHead>
              <TableHead className="font-bold text-black h-10">Severity</TableHead>
              <TableHead className="font-bold text-black h-10 w-[40%]">Title</TableHead>
              <TableHead className="font-bold text-black h-10 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((incident) => (
              <TableRow key={incident.id} className="border-black/10">
                <TableCell className="font-mono text-xs text-black/60">{incident.id}</TableCell>
                <TableCell className="text-sm font-medium">{incident.category}</TableCell>
                <TableCell>
                  <span className={`text-xs font-bold uppercase ${incident.severity === 'high' ? 'text-red-600' : incident.severity === 'medium' ? 'text-amber-600' : 'text-blue-600'}`}>
                    {incident.severity}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{incident.title}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline" className="text-[10px] border-black/20 print-exact">
                    {incident.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-12 text-center text-xs text-black/40">
        Confidential Incident Report — RailSense Operations
      </div>
    </div>
  , document.body);
}




