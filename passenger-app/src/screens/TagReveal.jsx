import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkle } from "@phosphor-icons/react";
import { useI18n } from "../i18n/I18nContext.jsx";
import { useAppStore } from "../store/appStore.js";
import IssueTag from "../components/IssueTag.jsx";
import SkeletonLoader from "../components/SkeletonLoader.jsx";
import { useComplaintFlow } from "../hooks/useComplaintFlow.js";

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.18, delayChildren: 0.1 }
  }
};

const tagVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.92 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", bounce: 0.15, duration: 0.5 }
  }
};

export default function TagReveal() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const draft = useAppStore((s) => s.complaintDraft);
  const { goToFollowUp } = useComplaintFlow();
  const [phase, setPhase] = useState("loading"); // loading | revealing

  useEffect(() => {
    const timer = setTimeout(() => setPhase("revealing"), reduced ? 200 : 600);
    return () => clearTimeout(timer);
  }, [reduced]);

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      padding: "32px 20px 40px",
      maxWidth: 480,
      width: "100%",
      margin: "0 auto",
      gap: 28,
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        style={{ display: "flex", alignItems: "center", gap: 10 }}
      >
        <motion.div
          animate={phase === "revealing" ? { rotate: [0, 20, -10, 0], scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Sparkle size={28} weight="fill" color="var(--rs-blue)" />
        </motion.div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
            {phase === "loading" ? t("understanding") : t("issuesFound")}
          </h1>
        </div>
      </motion.div>

      {/* Loading state */}
      <AnimatePresence mode="wait">
        {phase === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: "var(--rs-surface-card)",
              borderRadius: "var(--rs-radius-lg)",
              border: "1px solid var(--rs-border)",
              padding: 28,
            }}
          >
            <SkeletonLoader lines={4} height={24} gap={16} />
          </motion.div>
        )}

        {/* Hero moment #1: Tag reveal */}
        {phase === "revealing" && (
          <motion.div
            key="revealing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            style={{
              background: "var(--rs-surface-card)",
              borderRadius: "var(--rs-radius-lg)",
              border: "1px solid var(--rs-border)",
              padding: 28,
              boxShadow: "var(--rs-shadow-md)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Ambient gradient backdrop */}
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                top: -40, right: -40,
                width: 200, height: 200,
                borderRadius: "50%",
                background: "radial-gradient(circle, hsl(214 85% 52% / 0.12), transparent 70%)",
                pointerEvents: "none",
              }}
            />

            {/* Issue tags */}
            <motion.div
              variants={reduced ? undefined : containerVariants}
              initial="hidden"
              animate="show"
              style={{ display: "flex", flexWrap: "wrap", gap: 10, position: "relative", zIndex: 1 }}
            >
              {(draft.issues?.length ? draft.issues : ["General complaint"]).map((issue, i) => (
                reduced
                  ? <IssueTag key={issue} label={issue} index={0} />
                  : (
                    <motion.div key={issue} variants={tagVariants}>
                      <IssueTag label={issue} index={i} />
                    </motion.div>
                  )
              ))}
            </motion.div>

            {/* Train/coach info if extracted */}
            {(draft.train || draft.coach || draft.pnr) && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4, delay: (draft.issues?.length || 1) * 0.18 + 0.2 }}
                style={{
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid var(--rs-border)",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {draft.train && (
                  <span style={{
                    fontSize: 13, background: "var(--rs-surface-2)",
                    padding: "6px 12px", borderRadius: "var(--rs-radius-pill)",
                    color: "var(--rs-text-secondary)", fontWeight: 600,
                  }}>
                    Train {draft.train}
                  </span>
                )}
                {draft.coach && (
                  <span style={{
                    fontSize: 13, background: "var(--rs-surface-2)",
                    padding: "6px 12px", borderRadius: "var(--rs-radius-pill)",
                    color: "var(--rs-text-secondary)", fontWeight: 600,
                  }}>
                    Coach {draft.coach}
                  </span>
                )}
                {draft.pnr && (
                  <span style={{
                    fontSize: 13, background: "var(--rs-surface-2)",
                    padding: "6px 12px", borderRadius: "var(--rs-radius-pill)",
                    color: "var(--rs-text-secondary)", fontWeight: 600, fontVariantNumeric: "tabular-nums",
                  }}>
                    PNR {draft.pnr}
                  </span>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continue */}
      {phase === "revealing" && (
        <motion.button
          className="rs-btn-primary"
          onClick={goToFollowUp}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4, delay: 0.5 }}
          whileTap={{ scale: 0.97 }}
          style={{ width: "100%", marginTop: "auto" }}
        >
          {t("next")}
          <ArrowRight size={20} weight="bold" />
        </motion.button>
      )}
    </div>
  );
}
