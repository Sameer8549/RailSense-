import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Microphone, Keyboard, Camera, ArrowRight, CheckCircle, UploadSimple } from "@phosphor-icons/react";
import { useI18n } from "../i18n/I18nContext.jsx";
import { useAppStore } from "../store/appStore.js";
import { useComplaintFlow } from "../hooks/useComplaintFlow.js";
import { useMicInput } from "../hooks/useMicInput.js";
import OTPInput from "../components/OTPInput.jsx";
import MicButton from "../components/MicButton.jsx";
import WaveformBars from "../components/WaveformBars.jsx";
import SkeletonLoader from "../components/SkeletonLoader.jsx";
import ErrorCard from "../components/ErrorCard.jsx";
import { extractPnrFromPhoto } from "../lib/railsenseApi.js";
import { ticketFileToUploadDataUrl } from "../lib/imageUpload.js";

export default function FollowUp() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const draft = useAppStore((s) => s.complaintDraft);
  const updateDraft = useAppStore((s) => s.updateDraft);
  const { needsPNR, needsCoach, afterFollowUp } = useComplaintFlow();

  const [pnrValue, setPnrValue] = useState(draft.pnr || "");
  const [coachValue, setCoachValue] = useState(draft.coach || "");
  const [pnrMode, setPnrMode] = useState(null); // null | speak | type | photo
  const [photoState, setPhotoState] = useState("idle"); // idle | processing | done | error
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrConfident, setOcrConfident] = useState(false);
  const [ticketFields, setTicketFields] = useState({});
  const cameraRef = useRef(null);
  const uploadRef = useRef(null);

  const handlePNRTranscript = useCallback((text) => {
    const digits = text.replace(/\D/g, "").slice(0, 10);
    if (digits.length > 0) setPnrValue(digits);
  }, []);

  const { amplitude, micState, startListening, stopListening } = useMicInput({ onTranscript: handlePNRTranscript });

  async function handlePhotoCapture(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoState("processing");
    try {
      const dataUrl = await ticketFileToUploadDataUrl(file);
      setCapturedPhoto(dataUrl);
      updateDraft({ pnrPhotoBase64: dataUrl });
      const result = await extractPnrFromPhoto(dataUrl);
      setTicketFields(result);
      setOcrResult(result.pnr || "");
      setOcrConfident(!result.needsConfirmation && !!result.pnr);
      if (result.pnr) setPnrValue(result.pnr);
      if (result.coach) setCoachValue(result.coach);
      setPhotoState("done");
    } catch (_) {
      setPhotoState("error");
    } finally {
      e.target.value = "";
    }
  }

  function handleConfirm() {
    updateDraft({ pnr: pnrValue, coach: coachValue, train: ticketFields.trainNumber || draft.train });
    afterFollowUp();
  }

  const pnrReady = !needsPNR() || pnrValue.length === 10;
  const coachReady = !needsCoach() || coachValue.length > 0;
  const canContinue = pnrReady && coachReady;

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      padding: "32px 20px 40px",
      maxWidth: 480,
      width: "100%",
      margin: "0 auto",
      gap: 24,
    }}>
      {/* PNR section */}
      {needsPNR() && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
            {t("needPNR")}
          </h2>
          <p style={{ fontSize: 15, color: "var(--rs-text-secondary)", margin: "0 0 20px" }}>
            {t("howToSharePNR")}
          </p>

          {/* 3 equal-weight option cards */}
          {!pnrMode && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { mode: "speak", icon: <Microphone size={28} weight="bold" color="var(--rs-blue)" />, label: t("speakPNR") },
                { mode: "type",  icon: <Keyboard size={28} weight="bold" color="var(--rs-blue)" />,    label: t("typePNR") },
                { mode: "photo", icon: <Camera size={28} weight="bold" color="var(--rs-blue)" />,      label: t("photoTicket") },
              ].map(({ mode, icon, label }) => (
                <motion.button
                  key={mode}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setPnrMode(mode)}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "20px 20px",
                    background: "var(--rs-surface-card)",
                    border: "2px solid var(--rs-border)",
                    borderRadius: "var(--rs-radius-lg)",
                    cursor: "pointer",
                    textAlign: "left",
                    boxShadow: "var(--rs-shadow-sm)",
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: "var(--rs-radius-md)",
                    background: "var(--rs-blue-light)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>{icon}</div>
                  <span style={{ fontSize: 17, fontWeight: 700, color: "var(--rs-text-primary)" }}>{label}</span>
                </motion.button>
              ))}
            </div>
          )}

          {/* Speak PNR */}
          <AnimatePresence>
            {pnrMode === "speak" && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
                  padding: 28, background: "var(--rs-surface-card)",
                  borderRadius: "var(--rs-radius-lg)", border: "1px solid var(--rs-border)",
                }}
              >
                {micState === "active" && <WaveformBars amplitude={amplitude} barCount={5} />}
                <MicButton amplitude={amplitude} micState={micState}
                  onPointerDown={() => startListening(lang)} onStop={stopListening} />
                <p style={{ fontSize: 14, color: "var(--rs-text-secondary)", textAlign: "center", margin: 0 }}>
                  {micState === "active" ? t("listening") : micState === "processing" ? "Transcribing your PNR..." : t("tapMicToSpeak")}
                </p>
                {pnrValue.length > 0 && (
                  <div style={{
                    fontSize: 22, fontWeight: 700, letterSpacing: "0.1em",
                    fontVariantNumeric: "tabular-nums", color: "var(--rs-blue)",
                  }}>{pnrValue}</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Type PNR */}
          <AnimatePresence>
            {pnrMode === "type" && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <p style={{ fontSize: 14, color: "var(--rs-text-secondary)", margin: 0, textAlign: "center" }}>
                  {t("enterPNR")}
                </p>
                <OTPInput value={pnrValue} onChange={setPnrValue} length={10} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Photo PNR */}
          <AnimatePresence>
            {pnrMode === "photo" && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {photoState === "idle" && (
                  <>
                    <input ref={cameraRef} type="file" accept="image/png,image/jpeg,image/webp" capture="environment"
                      onChange={handlePhotoCapture} style={{ display: "none" }} aria-label="Capture ticket photo" />
                    <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={handlePhotoCapture} style={{ display: "none" }} aria-label="Upload ticket file" />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <motion.button className="rs-btn-primary" onClick={() => cameraRef.current?.click()} whileTap={{ scale: 0.97 }}>
                        <Camera size={20} weight="bold" /> Camera
                      </motion.button>
                      <motion.button className="rs-btn-ghost" onClick={() => uploadRef.current?.click()} whileTap={{ scale: 0.97 }}>
                        <UploadSimple size={20} weight="bold" /> Upload
                      </motion.button>
                    </div>
                  </>
                )}
                {photoState === "processing" && (
                  <div style={{ textAlign: "center", padding: 24 }}>
                    <SkeletonLoader lines={3} height={20} />
                    <p style={{ marginTop: 16, color: "var(--rs-text-secondary)", fontSize: 15 }}>{t("processingPhoto")}</p>
                  </div>
                )}
                {photoState === "done" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {capturedPhoto && (
                      <img src={capturedPhoto} alt="Ticket" style={{
                        borderRadius: "var(--rs-radius-md)", maxHeight: 180, objectFit: "cover", width: "100%"
                      }} />
                    )}
                    {ocrConfident ? (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: "var(--rs-success-bg)", borderRadius: "var(--rs-radius-md)", padding: "10px 14px",
                        color: "var(--rs-success)",
                      }}>
                        <CheckCircle size={20} weight="fill" />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{t("filledFromPhoto")}: {pnrValue}</span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <p style={{ fontSize: 14, color: "var(--rs-warning)", margin: 0, fontWeight: 600 }}>
                          {t("pleaseVerify")}
                        </p>
                        <OTPInput value={pnrValue} onChange={setPnrValue} length={10} />
                      </div>
                    )}
                    {(ticketFields.trainNumber || ticketFields.coach || ticketFields.berth) && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 13, color: "var(--rs-text-secondary)" }}>
                        {ticketFields.trainNumber && <span>Train {ticketFields.trainNumber}</span>}
                        {ticketFields.coach && <span>Coach {ticketFields.coach}</span>}
                        {ticketFields.berth && <span>Berth {ticketFields.berth}</span>}
                      </div>
                    )}
                  </div>
                )}
                {photoState === "error" && <ErrorCard variant="ocr_failed" onRetry={() => { setPhotoState("idle"); }} />}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      )}

      {/* Coach section */}
      {needsCoach() && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4, delay: needsPNR() ? 0.1 : 0 }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
            {t("needCoach")}
          </h2>
          <input
            type="text"
            className="rs-input"
            value={coachValue}
            onChange={(e) => setCoachValue(e.target.value.toUpperCase())}
            placeholder={t("coachPlaceholder")}
            maxLength={4}
            style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: 22, fontWeight: 700 }}
          />
        </motion.section>
      )}

      {/* Continue */}
      <motion.button
        className="rs-btn-primary"
        onClick={handleConfirm}
        disabled={!canContinue}
        whileTap={canContinue ? { scale: 0.97 } : undefined}
        style={{ width: "100%", marginTop: "auto" }}
      >
        {t("next")} <ArrowRight size={20} weight="bold" />
      </motion.button>
    </div>
  );
}
