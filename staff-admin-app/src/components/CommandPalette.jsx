import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ListChecks, Ship, Activity,
  LogOut, Sun, Moon, Monitor, Hash, Search,
  ArrowUpFromLine, CheckCircle, AlertTriangle, Copy,
} from "lucide-react";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator, CommandShortcut,
} from "@/components/ui/command.jsx";
import { useStaffStore } from "@/store/staffStore.js";
import { INCIDENTS } from "@/data/incidents.js";

export function CommandPalette({ open, setOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useStaffStore((s) => s.session);
  const setTheme = useStaffStore((s) => s.setTheme);
  const theme = useStaffStore((s) => s.theme);
  const logout = useStaffStore((s) => s.logout);
  const selectIncident = useStaffStore((s) => s.selectIncident);
  const selectedIncidentId = useStaffStore((s) => s.selectedIncidentId);
  const submitAction = useStaffStore((s) => s.submitAction);
  const [q, setQ] = useState("");

  const role = session?.role;

  // Global keyboard listener
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setOpen]);

  const run = (fn) => { setOpen(false); setQ(""); fn(); };

  // Filter incidents by search query
  const matchedIncidents = q.length >= 2
    ? INCIDENTS.filter(i =>
        i.id.toLowerCase().includes(q.toLowerCase()) ||
        i.train.includes(q) ||
        i.summary.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 5)
    : [];

  const selectedInc = selectedIncidentId ? INCIDENTS.find(i => i.id === selectedIncidentId) : null;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search incidents, navigate, or run actions…"
        value={q} onValueChange={setQ}
      />
      <CommandList>
        <CommandEmpty>No results. Try an incident ID or train number.</CommandEmpty>

        {/* Navigation */}
        <CommandGroup heading="Navigate">
          {role === "admin" && (
            <CommandItem onSelect={() => run(() => navigate("/dashboard"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
              <CommandShortcut>Admin</CommandShortcut>
            </CommandItem>
          )}
          <CommandItem onSelect={() => run(() => navigate("/queue"))}>
            <ListChecks className="mr-2 h-4 w-4" />
            Incident Queue
          </CommandItem>
          {role === "admin" && (
            <CommandItem onSelect={() => run(() => navigate("/fleet"))}>
              <Ship className="mr-2 h-4 w-4" />
              Fleet Overview
              <CommandShortcut>Admin</CommandShortcut>
            </CommandItem>
          )}
          {role === "tte" && (
            <CommandItem onSelect={() => run(() => navigate("/activity"))}>
              <Activity className="mr-2 h-4 w-4" />
              My Activity
              <CommandShortcut>TTE</CommandShortcut>
            </CommandItem>
          )}
        </CommandGroup>

        {/* Incident search results */}
        {matchedIncidents.length > 0 && (
          <CommandGroup heading="Incidents">
            {matchedIncidents.map(inc => (
              <CommandItem
                key={inc.id}
                onSelect={() => run(() => {
                  selectIncident(inc.id);
                  navigate("/queue");
                })}
              >
                <Hash className="mr-2 h-4 w-4" />
                <span className="font-mono">{inc.id}</span>
                <span className="ml-2 text-muted-foreground truncate">{inc.summary.slice(0, 40)}…</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Context-aware quick actions on open incident */}
        {selectedInc && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Quick actions — ${selectedInc.id}`}>
              {role === "tte" && (
                <>
                  <CommandItem onSelect={() => run(() => submitAction({ incidentId: selectedInc.id, type: "markAction", note: "Marked via command palette" }))}>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Mark action taken
                  </CommandItem>
                  <CommandItem onSelect={() => run(() => submitAction({ incidentId: selectedInc.id, type: "escalate", note: "Escalated via command palette" }))}>
                    <ArrowUpFromLine className="mr-2 h-4 w-4 text-red-500" />
                    Escalate to Maintenance
                  </CommandItem>
                  <CommandItem onSelect={() => run(() => submitAction({ incidentId: selectedInc.id, type: "markDuplicate", note: "Duplicate via command palette", reason: "Duplicate" }))}>
                    <Copy className="mr-2 h-4 w-4" />
                    Mark as duplicate
                  </CommandItem>
                </>
              )}
              {role === "admin" && (
                <>
                  <CommandItem onSelect={() => run(() => submitAction({ incidentId: selectedInc.id, type: "assignMaintenance", note: "Assigned via command palette" }))}>
                    <ArrowUpFromLine className="mr-2 h-4 w-4 text-blue-500" />
                    Assign to Maintenance
                  </CommandItem>
                  <CommandItem onSelect={() => run(() => submitAction({ incidentId: selectedInc.id, type: "scheduleInspection", note: "Scheduled via command palette" }))}>
                    <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                    Schedule Inspection
                  </CommandItem>
                  <CommandItem onSelect={() => run(() => submitAction({ incidentId: selectedInc.id, type: "verifyResolution", note: "Verified via command palette" }))}>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Verify Resolution Held
                  </CommandItem>
                </>
              )}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        {/* Theme */}
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => run(() => setTheme("light"))} disabled={theme === "light"}>
            <Sun className="mr-2 h-4 w-4" /> Light mode {theme === "light" && "✓"}
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme("dark"))} disabled={theme === "dark"}>
            <Moon className="mr-2 h-4 w-4" /> Dark mode {theme === "dark" && "✓"}
          </CommandItem>
          <CommandItem onSelect={() => run(() => setTheme("system"))} disabled={theme === "system"}>
            <Monitor className="mr-2 h-4 w-4" /> System theme {theme === "system" && "✓"}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup>
          <CommandItem onSelect={() => run(() => { logout(); navigate("/"); })} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Log out / Switch user
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
