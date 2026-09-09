import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useI18n } from "./i18n/I18nContext.jsx";
import { useAppStore } from "./store/appStore.js";
import AppShell from "./components/AppShell.jsx";

import LanguageSelect   from "./screens/LanguageSelect.jsx";
import Composer         from "./screens/Composer.jsx";
import TagReveal        from "./screens/TagReveal.jsx";
import FollowUp         from "./screens/FollowUp.jsx";
import Evidence         from "./screens/Evidence.jsx";
import ConfirmCard      from "./screens/ConfirmCard.jsx";
import Done             from "./screens/Done.jsx";
import TrackComplaint   from "./screens/TrackComplaint.jsx";

function ProtectedRoute({ children }) {
  const { lang } = useI18n();
  if (!lang) return <Navigate to="/" replace />;
  return children;
}

function PageTransition({ children }) {
  const reduced = useReducedMotion();
  if (reduced) return children;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: "spring", bounce: 0, duration: 0.32 }}
      style={{ flex: 1, display: "flex", flexDirection: "column" }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location   = useLocation();
  // darkMode now lives in the zustand-persist store — reading it here ensures
  // the <html> class stays in sync after a page reload with persisted state.
  const darkMode   = useAppStore((s) => s.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"
            element={<PageTransition><LanguageSelect /></PageTransition>} />

          <Route path="/compose"
            element={<ProtectedRoute><PageTransition><Composer /></PageTransition></ProtectedRoute>} />

          <Route path="/understanding"
            element={<ProtectedRoute><PageTransition><TagReveal /></PageTransition></ProtectedRoute>} />

          <Route path="/followup"
            element={<ProtectedRoute><PageTransition><FollowUp /></PageTransition></ProtectedRoute>} />

          <Route path="/evidence"
            element={<ProtectedRoute><PageTransition><Evidence /></PageTransition></ProtectedRoute>} />

          <Route path="/confirm"
            element={<ProtectedRoute><PageTransition><ConfirmCard /></PageTransition></ProtectedRoute>} />

          <Route path="/done"
            element={<ProtectedRoute><PageTransition><Done /></PageTransition></ProtectedRoute>} />

          {/* Track is always accessible — no lang guard needed */}
          <Route path="/track"
            element={<PageTransition><TrackComplaint /></PageTransition>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </AppShell>
  );
}
