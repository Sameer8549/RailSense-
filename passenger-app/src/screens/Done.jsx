import { motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Confetti } from "@phosphor-icons/react";
import { useI18n } from "../i18n/I18nContext.jsx";
import { useAppStore } from "../store/appStore.js";

function CharReveal({ text, delay = 0, reduced }) {
  if (reduced) return <span>{text}</span>;
  return (
    <span>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3, delay: delay + i * 0.04 }}
          style={{ display: "inline-block" }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

export default function Done() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const submittedComplaint = useAppStore((s) => s.submittedComplaint);
  const resetComplaint = useAppStore((s) => s.resetComplaint);

  const id = submittedComplaint?.id || "RS-2026-00000";

  return (
    <div style={{
      flex: 1,
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      background: "linear-gradient(160deg, hsl(220 40% 8%), hsl(214 85% 18%) 60%, hsl(220 40% 12%))",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background ambient orbs */}
      {!reduced && (
        <>
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute", width: 320, height: 320, borderRadius: "50%",
              background: "radial-gradient(circle, hsl(214 85% 52% / 0.4), transparent 70%)",
              top: "10%", left: "50%", transform: "translateX(-50%)",
              pointerEvents: "none",
            }}
          />
          <motion.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            style={{
              position: "absolute", width: 200, height: 200, borderRadius: "50%",
              background: "radial-gradient(circle, hsl(150 55% 40% / 0.3), transparent 70%)",
              bottom: "20%", right: "10%",
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {/* Ticket stub — hero moment #2 */}
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={reduced
          ? { duration: 0.3 }
          : { type: "spring", bounce: 0.2, duration: 0.6 }
        }
        style={{
          background: "hsl(0 0% 100%)",
          borderRadius: 24,
          padding: 32,
          maxWidth: 380,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          position: "relative",
          zIndex: 1,
          boxShadow: "0 24px 80px hsl(0 0% 0% / 0.5), 0 8px 32px hsl(214 85% 52% / 0.3)",
        }}
      >
        {/* Success icon */}
        <motion.div
          initial={reduced ? { opacity: 0 } : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={reduced
            ? { delay: 0.1, duration: 0.2 }
            : { type: "spring", bounce: 0.35, duration: 0.55, delay: 0.25 }
          }
        >
          <CheckCircle size={64} weight="fill" color="var(--rs-success)" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4, delay: reduced ? 0.15 : 0.5 }}
          style={{ textAlign: "center" }}
        >
          <h1 style={{
            fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em",
            color: "hsl(220 20% 12%)", margin: "0 0 4px"
          }}>
            {t("complaintFiled")}
          </h1>
        </motion.div>

        {/* Complaint ID */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduced ? 0.2 : 0.7, duration: 0.3 }}
          style={{
            background: "hsl(220 20% 97%)",
            borderRadius: 12,
            padding: "16px 24px",
            textAlign: "center",
            width: "100%",
          }}
        >
          <p style={{ fontSize: 12, color: "hsl(220 12% 50%)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>
            {t("complaintID")}
          </p>
          <div style={{
            fontSize: 26, fontWeight: 800, fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.05em", color: "var(--rs-blue)",
          }}>
            <CharReveal text={id} delay={0.8} reduced={reduced} />
          </div>
        </motion.div>

        {/* SMS notice */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduced ? 0.3 : 1.2, duration: 0.4 }}
          style={{
            fontSize: 14, color: "hsl(220 12% 50%)",
            textAlign: "center", margin: 0, lineHeight: 1.5,
          }}
        >
          {t("smsUpdates")}
        </motion.p>

        {/* Divider */}
        <div style={{ width: "100%", height: 1, background: "var(--rs-border)" }} />

        {/* Track button */}
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4, delay: reduced ? 0.4 : 1.4 }}
          onClick={() => navigate("/track")}
          whileTap={{ scale: 0.96 }}
          style={{
            width: "100%",
            background: "var(--rs-blue)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--rs-radius-pill)",
            padding: "14px 20px",
            fontSize: 16, fontWeight: 700,
            cursor: "pointer",
            minHeight: 52,
          }}
        >
          {t("trackComplaint")}
        </motion.button>

        {/* File another */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduced ? 0.5 : 1.6, duration: 0.3 }}
          onClick={() => { resetComplaint(); navigate("/compose"); }}
          whileTap={{ scale: 0.96 }}
          style={{
            background: "transparent", border: "none",
            color: "hsl(220 12% 50%)", fontSize: 14, fontWeight: 600,
            cursor: "pointer", padding: "8px 16px",
          }}
        >
          {t("fileAnotherComplaint")}
        </motion.button>
      </motion.div>
    </div>
  );
}
