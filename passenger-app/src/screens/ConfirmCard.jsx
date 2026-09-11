import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { PencilSimple, CheckCircle } from "@phosphor-icons/react";
import { useI18n } from "../i18n/I18nContext.jsx";
import { useAppStore } from "../store/appStore.js";
import IssueTag from "../components/IssueTag.jsx";
import { LogoChip } from "../components/AppShell.jsx";

function EditableField({ label, value, fieldKey, onSave, placeholder }) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  const { t } = useI18n();

  function commit() {
    onSave(fieldKey, localVal);
    setEditing(false);
  }

  return (
    <motion.div layout style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, color: "var(--rs-text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </span>
      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div
            key="edit"
            layoutId={`field-${fieldKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.25 }}
            style={{ display: "flex", gap: 8 }}
          >
            <input
              autoFocus
              type="text"
              value={localVal}
              onChange={(e) => setLocalVal(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === "Enter" && commit()}
              className="rs-input"
              style={{ flex: 1, minHeight: 44 }}
              placeholder={placeholder || label}
              aria-label={label}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={commit}
              style={{
                background: "var(--rs-blue)", color: "#fff",
                border: "none", borderRadius: "var(--rs-radius-md)",
                padding: "0 14px", cursor: "pointer", minHeight: 44,
                display: "flex", alignItems: "center",
              }}
            >
              <CheckCircle size={20} weight="fill" />
            </motion.button>
          </motion.div>
        ) : (
          <motion.button
            key="display"
            layoutId={`field-${fieldKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.25 }}
            onClick={() => setEditing(true)}
            aria-label={`${t("tapToEdit")}: ${label}`}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "var(--rs-surface-2)",
              border: "1px solid var(--rs-border)",
              borderRadius: "var(--rs-radius-md)",
              padding: "12px 14px",
              cursor: "pointer",
              minHeight: 48,
              textAlign: "left",
            }}
          >
            <span style={{
              fontSize: 17, fontWeight: 600,
              color: value ? "var(--rs-text-primary)" : "var(--rs-text-tertiary)",
              fontVariantNumeric: "tabular-nums",
            }}>
              {value || placeholder}
            </span>
            <PencilSimple size={16} color="var(--rs-text-tertiary)" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ConfirmCard() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const draft = useAppStore((s) => s.complaintDraft);
  const updateDraft = useAppStore((s) => s.updateDraft);
  const submitComplaint = useAppStore((s) => s.submitComplaint);
  const complaintStatus = useAppStore((s) => s.complaintStatus);
  const submittedComplaint = useAppStore((s) => s.submittedComplaint);
  const lastBackendError = useAppStore((s) => s.lastBackendError);

  function handleFieldSave(key, value) {
    updateDraft({ [key]: value });
  }

  function handleSubmit() {
    submitComplaint();
  }

  const isUnreserved = draft.ticketType === "UNRESERVED";

  useEffect(() => {
    if (submittedComplaint) navigate("/done");
  }, [navigate, submittedComplaint]);

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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
          {t("reviewComplaint")}
        </h1>
        <p style={{ fontSize: 14, color: "var(--rs-text-secondary)", margin: 0 }}>
          {t("confirmSubtext")}
        </p>
      </motion.div>

      {/* Ticket-stub styled card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", bounce: 0.1, duration: 0.5, delay: 0.1 }}
        style={{
          background: "var(--rs-surface-card)",
          borderRadius: "var(--rs-radius-lg)",
          border: "1px solid var(--rs-border)",
          boxShadow: "var(--rs-shadow-md)",
          overflow: "hidden",
        }}
      >
        {/* Ticket header strip */}
        <div style={{
          background: "var(--rs-blue)",
          padding: "14px 20px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <img src="/app/logo.png" alt="" style={{ height: 24, width: 24, borderRadius: 6, objectFit: "contain" }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em" }}>
            RailSense AI
          </span>
        </div>

        {/* Serrated edge effect */}
        <div style={{
          height: 18,
          background: `radial-gradient(circle at 50% 100%, var(--rs-surface) 10px, transparent 10px),
                       radial-gradient(circle at 0% 0%, var(--rs-surface-card) 10px, transparent 10px)`,
          backgroundSize: "22px 18px",
          backgroundRepeat: "repeat-x",
        }} />

        {/* Fields */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          <EditableField label={t("trainNumber")} value={draft.train} fieldKey="train"
            onSave={handleFieldSave} placeholder={t("notProvided")} />
          {isUnreserved ? (
            <>
              <EditableField label="Coach zone" value={draft.coachZone} fieldKey="coachZone"
                onSave={handleFieldSave} placeholder="Front / Middle / Back" />
              <EditableField label="UTS reference" value={draft.utsNumber} fieldKey="utsNumber"
                onSave={handleFieldSave} placeholder="Optional" />
            </>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <EditableField label={t("coach")} value={draft.coach} fieldKey="coach"
                  onSave={handleFieldSave} placeholder={t("notProvided")} />
                <EditableField label={t("berth")} value={draft.berth} fieldKey="berth"
                  onSave={handleFieldSave} placeholder={t("notProvided")} />
              </div>
              <EditableField label={t("pnr")} value={draft.pnr} fieldKey="pnr"
                onSave={handleFieldSave} placeholder={t("notProvided")} />
            </>
          )}

          {/* Issues */}
          <div>
            <span style={{ fontSize: 12, color: "var(--rs-text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {t("issues")}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {(draft.issues || []).map((issue, i) => (
                <IssueTag key={issue} label={issue} index={0} />
              ))}
            </div>
          </div>

          {/* Photo */}
          {draft.photoEvidence && (
            <div>
              <span style={{ fontSize: 12, color: "var(--rs-text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {t("photo")}
              </span>
              <img src={draft.photoEvidence} alt="Evidence" style={{
                marginTop: 8,
                width: "100%", height: 120, objectFit: "cover",
                borderRadius: "var(--rs-radius-md)",
              }} />
            </div>
          )}
        </div>

        {/* Bottom serrated */}
        <div style={{
          height: 18,
          background: `radial-gradient(circle at 50% 0%, var(--rs-surface) 10px, transparent 10px)`,
          backgroundSize: "22px 18px",
          backgroundRepeat: "repeat-x",
        }} />
      </motion.div>

      {/* Submit */}
      <motion.button
        className="rs-btn-primary"
        onClick={handleSubmit}
        disabled={complaintStatus === "submitting"}
        whileTap={{ scale: 0.97 }}
        style={{ width: "100%", marginTop: "auto" }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4, delay: 0.3 }}
      >
        {complaintStatus === "submitting" ? t("submitting") : t("submitComplaint")}
      </motion.button>
      {complaintStatus === "error" && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            margin: "-12px 0 0",
            color: "var(--rs-red)",
            fontSize: 13,
            lineHeight: 1.45,
            textAlign: "center",
          }}
        >
          {lastBackendError || t("errorNetwork")}
        </motion.p>
      )}
    </div>
  );
}

