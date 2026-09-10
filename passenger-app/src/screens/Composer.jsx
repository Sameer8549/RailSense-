import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import { useI18n } from "../i18n/I18nContext.jsx";
import { useAppStore } from "../store/appStore.js";
import { useMicInput } from "../hooks/useMicInput.js";
import MicButton from "../components/MicButton.jsx";
import WaveformBars from "../components/WaveformBars.jsx";
import ErrorCard from "../components/ErrorCard.jsx";
import { useComplaintFlow } from "../hooks/useComplaintFlow.js";
import { analyzeComplaint } from "../lib/railsenseApi.js";

export default function Composer() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const updateDraft = useAppStore((s) => s.updateDraft);
  const setComplaintStatus = useAppStore((s) => s.setComplaintStatus);
  const { goToFollowUp } = useComplaintFlow();

  const [typedText, setTypedText] = useState("");
  const [mode, setMode] = useState("voice"); // voice | text

  const handleTranscript = useCallback((transcript) => {
    setTypedText((prev) => prev ? prev + " " + transcript : transcript);
  }, []);

  const { amplitude, micState, startListening, stopListening } = useMicInput({ onTranscript: handleTranscript });

  async function handleNext() {
    if (!typedText.trim()) return;
    setComplaintStatus("processing");
    try {
      const extracted = await analyzeComplaint({ transcript: typedText, language: lang || "en" });
      updateDraft({
        voiceTranscript: typedText,
        issues: extracted.issues || [],
        train: extracted.train || extracted.trainNumber || "",
        coach: extracted.coach || "",
        berth: extracted.berth || "",
        pnr: extracted.pnr || "",
      });
      navigate("/understanding");
    } catch (error) {
      setComplaintStatus("error");
      updateDraft({ voiceTranscript: typedText, issues: [] });
    }
  }

  const canProceed = typedText.trim().length > 2;

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
      {/* Prompt */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 8px", lineHeight: 1.2 }}>
          {t("composerPrompt")}
        </h1>
        <p style={{ fontSize: 15, color: "var(--rs-text-secondary)", margin: 0, lineHeight: 1.5 }}>
          {t("composerSubtext")}
        </p>
      </motion.div>

      {/* Mode toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        style={{
          display: "flex",
          background: "var(--rs-surface-2)",
          borderRadius: "var(--rs-radius-pill)",
          padding: 4,
          gap: 4,
        }}
      >
        {["voice", "text"].map((m) => (
          <motion.button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "var(--rs-radius-pill)",
              border: "none",
              background: mode === m ? "var(--rs-surface-card)" : "transparent",
              color: mode === m ? "var(--rs-text-primary)" : "var(--rs-text-secondary)",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: mode === m ? "var(--rs-shadow-sm)" : "none",
              transition: "all 0.2s ease",
            }}
            whileTap={{ scale: 0.96 }}
          >
            {m === "voice" ? `${t("tapMicToSpeak")}`.split(" ")[0] : t("orTypeBelow").replace("or ", "")}
          </motion.button>
        ))}
      </motion.div>

      {/* Mic section */}
      <AnimatePresence mode="wait">
        {mode === "voice" ? (
          <motion.div
            key="voice"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
              padding: "32px 20px",
              background: "var(--rs-surface-card)",
              borderRadius: "var(--rs-radius-lg)",
              border: "1px solid var(--rs-border)",
            }}
          >
            {micState === "active" && (
              <WaveformBars amplitude={amplitude} barCount={7} />
            )}

            <MicButton
              amplitude={amplitude}
              micState={micState}
              onPointerDown={() => startListening(lang)}
              onStop={stopListening}
            />

            <p style={{
              fontSize: 14, color: "var(--rs-text-secondary)", textAlign: "center",
              margin: 0, lineHeight: 1.4,
            }}>
              {micState === "active" ? t("listening") :
               micState === "requesting" ? "..." :
               micState === "error" ? "Could not transcribe. Please try again or type below." :
               t("tapMicToSpeak")}
            </p>

            {micState === "denied" && (
              <ErrorCard variant="mic_denied" />
            )}
            {micState === "error" && (
              <ErrorCard variant="network" />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          >
            <textarea
              className="rs-input"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={t("typeYourComplaint")}
              rows={5}
              aria-label={t("typeYourComplaint")}
              style={{
                resize: "none",
                minHeight: 140,
                fontSize: 17,
                lineHeight: 1.5,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript preview */}
      <AnimatePresence>
        {typedText.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: "var(--rs-blue-light)",
              borderRadius: "var(--rs-radius-md)",
              padding: "12px 16px",
              fontSize: 14,
              color: "var(--rs-blue)",
              lineHeight: 1.5,
              border: "1px solid hsl(214 85% 80%)",
            }}
          >
            {typedText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next button */}
      <motion.button
        className="rs-btn-primary"
        onClick={handleNext}
        disabled={!canProceed}
        whileTap={canProceed ? { scale: 0.97 } : undefined}
        style={{ width: "100%", marginTop: "auto" }}
      >
        {t("next")}
        <ArrowRight size={20} weight="bold" />
      </motion.button>
    </div>
  );
}
