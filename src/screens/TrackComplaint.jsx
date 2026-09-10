import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MagnifyingGlass, CheckCircle, Circle, ArrowLeft, ClockCounterClockwise } from "@phosphor-icons/react";
import { useI18n } from "../i18n/I18nContext.jsx";
import { useAppStore } from "../store/appStore.js";
import SkeletonLoader from "../components/SkeletonLoader.jsx";
import ErrorCard from "../components/ErrorCard.jsx";

const STATUS_STEPS = ["filed", "acknowledged", "underReview", "resolved"];
const STATUS_LABEL_KEYS = {
  filed: "statusFiled",
  acknowledged: "statusAcknowledged",
  underReview: "statusUnderReview",
  resolved: "statusResolved",
};

function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function formatTimestamp(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

// ─── Sub-component: Timeline view ──────────────────────────────────────────
function Timeline({ result, onBack, t }) {
  const currentStepIndex = STATUS_STEPS.indexOf(result.currentStatus);
  return (
    <motion.div
      key="timeline"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: "spring", bounce: 0, duration: 0.35 }}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      {onBack && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "transparent", border: "none",
            color: "var(--rs-text-secondary)", fontSize: 14, fontWeight: 600,
            cursor: "pointer", padding: "4px 0", alignSelf: "flex-start",
          }}
        >
          <ArrowLeft size={16} weight="bold" /> {t("back")}
        </motion.button>
      )}

      {/* Complaint ID badge */}
      <div className="rs-card" style={{ padding: "16px 20px" }}>
        <p style={{ fontSize: 12, color: "var(--rs-text-tertiary)", fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>
          {t("complaintID")}
        </p>
        <div style={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.04em", color: "var(--rs-blue)" }}>
          {result.id}
        </div>
      </div>

      {/* Status timeline */}
      <div className="rs-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {STATUS_STEPS.map((step, i) => {
            const stepData = result.steps?.find((s) => s.status === step);
            const isDone = i <= currentStepIndex;
            const isCurrent = i === currentStepIndex;
            const isLast = i === STATUS_STEPS.length - 1;
            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", bounce: 0, duration: 0.4, delay: i * 0.08 }}
                style={{ display: "flex", gap: 14, paddingBottom: isLast ? 0 : 20 }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  {isDone
                    ? <CheckCircle size={24} weight="fill" color={isCurrent ? "var(--rs-blue)" : "var(--rs-success)"} />
                    : <Circle size={24} weight="regular" color="var(--rs-border)" />
                  }
                  {!isLast && (
                    <div style={{
                      width: 2, flex: 1, marginTop: 4,
                      background: isDone ? "var(--rs-success)" : "var(--rs-border)",
                      minHeight: 20,
                    }} />
                  )}
                </div>
                <div style={{ paddingBottom: 4 }}>
                  <div style={{
                    fontSize: 15, fontWeight: isCurrent ? 700 : 600,
                    color: isDone ? "var(--rs-text-primary)" : "var(--rs-text-tertiary)",
                  }}>
                    {t(STATUS_LABEL_KEYS[step])}
                    {isCurrent && (
                      <span style={{
                        marginLeft: 8, fontSize: 11, fontWeight: 700,
                        background: "var(--rs-blue-light)", color: "var(--rs-blue)",
                        padding: "2px 8px", borderRadius: "var(--rs-radius-pill)",
                      }}>Now</span>
                    )}
                  </div>
                  {stepData?.timestamp && (
                    <div style={{ fontSize: 12, color: "var(--rs-text-tertiary)", marginTop: 2 }}>
                      {formatTimestamp(stepData.timestamp)}
                    </div>
                  )}
                  {stepData?.note && (
                    <div style={{ fontSize: 13, color: "var(--rs-text-secondary)", marginTop: 4, lineHeight: 1.4 }}>
                      {stepData.note}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Sub-component: Local complaint picker ──────────────────────────────────
function LocalComplaintPicker({ complaints, onSelect, t }) {
  return (
    <motion.div
      key="picker"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: "spring", bounce: 0, duration: 0.35 }}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <ClockCounterClockwise size={18} weight="bold" color="var(--rs-text-tertiary)" />
        <p style={{ fontSize: 13, color: "var(--rs-text-tertiary)", margin: 0, fontWeight: 600 }}>
          Complaints filed from this device
        </p>
      </div>
      {complaints.map((c, i) => (
        <motion.button
          key={c.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.35, delay: i * 0.06 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(c.id)}
          className="rs-card"
          style={{
            padding: "16px 18px",
            cursor: "pointer", border: "2px solid var(--rs-border)",
            textAlign: "left", display: "flex", flexDirection: "column", gap: 4,
            background: "var(--rs-surface-card)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 800, fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.04em", color: "var(--rs-blue)" }}>
              {c.id}
            </span>
            <span style={{ fontSize: 12, color: "var(--rs-text-tertiary)", flexShrink: 0 }}>
              {formatDate(c.timestamp)}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--rs-text-secondary)", margin: 0, lineHeight: 1.4 }}>
            {c.summary}
          </p>
          {(c.train || c.coach) && (
            <div style={{ display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
              {c.train && (
                <span style={{ fontSize: 11, background: "var(--rs-surface-2)", color: "var(--rs-text-tertiary)",
                  padding: "2px 8px", borderRadius: "var(--rs-radius-pill)", fontWeight: 600 }}>
                  Train {c.train}
                </span>
              )}
              {c.coach && (
                <span style={{ fontSize: 11, background: "var(--rs-surface-2)", color: "var(--rs-text-tertiary)",
                  padding: "2px 8px", borderRadius: "var(--rs-radius-pill)", fontWeight: 600 }}>
                  Coach {c.coach}
                </span>
              )}
            </div>
          )}
        </motion.button>
      ))}
    </motion.div>
  );
}

// ─── Sub-component: Manual ID entry ────────────────────────────────────────
function ManualEntry({ onSearch, trackingStatus, t }) {
  const [inputId, setInputId] = useState("");
  function handleSubmit(e) {
    e.preventDefault();
    if (!inputId.trim()) return;
    onSearch(inputId.trim());
  }
  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <label htmlFor="complaint-id-input" style={{
        fontSize: 14, color: "var(--rs-text-secondary)", fontWeight: 600, display: "block", marginBottom: 2,
      }}>
        {t("enterComplaintID")}
      </label>
      <input
        id="complaint-id-input"
        type="text"
        value={inputId}
        onChange={(e) => setInputId(e.target.value.toUpperCase())}
        placeholder={t("complaintIDPlaceholder")}
        className="rs-input"
        aria-label={t("enterComplaintID")}
        style={{ textTransform: "uppercase", letterSpacing: "0.05em",
          fontVariantNumeric: "tabular-nums", fontSize: 18, fontWeight: 700 }}
      />
      <motion.button
        type="submit"
        className="rs-btn-primary"
        disabled={trackingStatus === "searching" || !inputId.trim()}
        whileTap={{ scale: 0.97 }}
      >
        <MagnifyingGlass size={20} weight="bold" />
        {trackingStatus === "searching" ? t("searching") : t("findComplaint")}
      </motion.button>
    </motion.form>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────
export default function TrackComplaint() {
  const { t } = useI18n();
  const trackComplaintById = useAppStore((s) => s.trackComplaintById);
  const trackingResult = useAppStore((s) => s.trackingResult);
  const trackingStatus = useAppStore((s) => s.trackingStatus);
  const localComplaints = useAppStore((s) => s.localComplaints);

  // view: "auto" → "picker" → "timeline" | "manual" → "timeline"
  const hasLocal = localComplaints.length > 0;
  const [view, setView] = useState(() => hasLocal ? "auto" : "manual");
  const [showManualEntry, setShowManualEntry] = useState(!hasLocal);

  // On mount: if exactly one local complaint, auto-load its status immediately
  useEffect(() => {
    if (localComplaints.length === 1 && view === "auto") {
      trackComplaintById(localComplaints[0].id);
      setView("timeline");
    } else if (localComplaints.length > 1 && view === "auto") {
      setView("picker");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelectLocal(id) {
    trackComplaintById(id);
    setView("timeline");
    setShowManualEntry(false);
  }

  function handleManualSearch(id) {
    trackComplaintById(id);
    setView("timeline");
  }

  function handleBackFromTimeline() {
    if (localComplaints.length > 1) {
      setView("picker");
    } else {
      setView("manual");
      setShowManualEntry(true);
    }
  }

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
      <AnimatePresence mode="wait">
        {/* Picker — multiple local complaints */}
        {view === "picker" && (
          <motion.div key="picker-view" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <LocalComplaintPicker complaints={localComplaints} onSelect={handleSelectLocal} t={t} />
            <div style={{ borderTop: "1px solid var(--rs-border)", paddingTop: 16 }}>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => { setView("manual"); setShowManualEntry(true); }}
                style={{
                  background: "transparent", border: "none",
                  color: "var(--rs-blue)", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <MagnifyingGlass size={16} weight="bold" /> Enter a different Complaint ID
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Manual entry (standalone or fallback) */}
        {view === "manual" && (
          <motion.div key="manual-view">
            <ManualEntry onSearch={handleManualSearch} trackingStatus={trackingStatus} t={t} />
          </motion.div>
        )}

        {/* Timeline + loading/error states */}
        {view === "timeline" && (
          <motion.div key="timeline-view" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {trackingStatus === "searching" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <SkeletonLoader lines={5} height={22} gap={16} />
              </motion.div>
            )}
            {trackingStatus === "not_found" && (
              <ErrorCard
                variant="not_found"
                onRetry={() => { setView(hasLocal ? "picker" : "manual"); setShowManualEntry(!hasLocal); }}
              />
            )}
            {trackingStatus === "found" && trackingResult && (
              <Timeline
                result={trackingResult}
                onBack={hasLocal || localComplaints.length > 0 ? handleBackFromTimeline : null}
                t={t}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Track a different complaint" fallback — always visible on timeline if local complaints exist */}
      {view === "timeline" && trackingStatus === "found" && hasLocal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ borderTop: "1px solid var(--rs-border)", paddingTop: 16, marginTop: 4 }}
        >
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { setView("manual"); setShowManualEntry(true); }}
            style={{
              background: "transparent", border: "none",
              color: "var(--rs-text-secondary)", fontSize: 13, fontWeight: 600,
              cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <MagnifyingGlass size={15} weight="bold" /> Track a different Complaint ID
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
