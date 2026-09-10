import { useState } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";

export function ExportMenu({ incidents }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      if (!incidents || incidents.length === 0) return;

      const headers = ["ID", "Category", "Severity", "Title", "Status", "Reported Time", "Location"];
      const rows = incidents.map(inc => [
        inc.id,
        inc.category,
        inc.severity,
        `"${inc.title.replace(/"/g, '""')}"`,
        inc.status,
        new Date(inc.timestamp).toLocaleString(),
        `"${inc.location.replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `railsense-export-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed flex-shrink-0" disabled={!incidents || incidents.length === 0 || isExporting}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
          <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-500" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4 text-rose-600 dark:text-rose-500" />
          Download PDF Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
