import { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { AppShell } from "@/components/AppShell.jsx";
import { CommandPalette } from "@/components/CommandPalette.jsx";
import { useStaffStore } from "@/store/staffStore.js";
import Login from "@/screens/Login.jsx";
import Dashboard from "@/screens/Dashboard.jsx";
import IncidentQueue from "@/screens/IncidentQueue.jsx";
import TTEActivity from "@/screens/TTEActivity.jsx";
import FleetOverview from "@/screens/FleetOverview.jsx";
import Analytics from "@/screens/Analytics.jsx";

function RequireAuth({ children, allowedRole }) {
  const session = useStaffStore((s) => s.session);
  if (!session) return <Navigate to="/" replace />;
  if (allowedRole && session.role !== allowedRole) {
    return <Navigate to={session.role === "admin" ? "/dashboard" : "/queue"} replace />;
  }
  return children;
}

// Page: fills AppShell main (overflow-hidden h-100%). 
// Scrollable screens (Dashboard etc.) must have overflow-auto on their own root.
function Page({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      {children}
    </motion.div>
  );
}

function AppLayout() {
  const [cmdOpen, setCmdOpen] = useState(false);
  const location = useLocation();
  const session = useStaffStore((s) => s.session);

  return (
    <AppShell onCommandOpen={() => setCmdOpen(true)}>
      <CommandPalette open={cmdOpen} setOpen={setCmdOpen} />
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/dashboard" element={
            <RequireAuth allowedRole="admin"><Page><Dashboard /></Page></RequireAuth>
          } />
          <Route path="/queue" element={
            <RequireAuth><Page><IncidentQueue /></Page></RequireAuth>
          } />
          <Route path="/activity" element={
            <RequireAuth allowedRole="tte"><Page><TTEActivity /></Page></RequireAuth>
          } />
          <Route path="/analytics" element={
            <RequireAuth allowedRole="admin"><Page><Analytics /></Page></RequireAuth>
          } />
          <Route path="/fleet" element={
            <RequireAuth allowedRole="admin"><Page><FleetOverview /></Page></RequireAuth>
          } />
          <Route path="*" element={
            <Navigate to={session?.role === "admin" ? "/dashboard" : "/queue"} replace />
          } />
        </Routes>
      </AnimatePresence>
    </AppShell>
  );
}

export default function App() {
  const session = useStaffStore((s) => s.session);
  if (!session) return <Login />;
  return <AppLayout />;
}