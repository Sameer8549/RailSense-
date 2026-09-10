import { useRef, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Camera, ArrowRight, X } from "@phosphor-icons/react";
import { useI18n } from "../i18n/I18nContext.jsx";
import { useAppStore } from "../store/appStore.js";
import { imageFileToUploadDataUrl } from "../lib/imageUpload.js";

export default function Evidence() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const updateDraft = useAppStore((s) => s.updateDraft);
  const fileRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await imageFileToUploadDataUrl(file, { maxDimension: 1280, quality: 0.76 });
      setPhotoPreview(dataUrl);
      updateDraft({ photoEvidence: dataUrl, evidencePhotoBase64: dataUrl });
    } finally {
      e.target.value = "";
    }
  }

  function handleClear() {
    setPhotoPreview(null);
    updateDraft({ photoEvidence: null, evidencePhotoBase64: null });
  }

  function handleContinue(withPhoto) {
    if (!withPhoto) updateDraft({ photoEvidence: null, evidencePhotoBase64: null });
    navigate("/confirm");
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
      gap: 28,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
          {t("evidencePrompt")}
        </h1>
        <p style={{ fontSize: 15, color: "var(--rs-text-secondary)", margin: 0, lineHeight: 1.5 }}>
          {t("evidenceSubtext")}
        </p>
      </motion.div>

      {/* Photo preview or capture area */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4, delay: 0.1 }}
        style={{
          borderRadius: "var(--rs-radius-lg)",
          overflow: "hidden",
          border: "2px dashed var(--rs-border)",
          minHeight: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "var(--rs-surface-card)",
          cursor: photoPreview ? "default" : "pointer",
        }}
        onClick={() => !photoPreview && fileRef.current?.click()}
      >
        {photoPreview ? (
          <>
            <img src={photoPreview} alt={t("photo")} style={{ width: "100%", height: "100%", objectFit: "cover", maxHeight: 280 }} />
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleClear}
              aria-label="Remove photo"
              style={{
                position: "absolute", top: 10, right: 10,
                width: 36, height: 36,
                background: "hsl(0 0% 0% / 0.6)",
                border: "none", borderRadius: "50%",
                color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={18} weight="bold" />
            </motion.button>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 32 }}>
            <Camera size={48} weight="light" color="var(--rs-text-tertiary)" />
            <span style={{ fontSize: 15, color: "var(--rs-text-tertiary)" }}>{t("addPhoto")}</span>
          </div>
        )}
      </motion.div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        onChange={handlePhoto} style={{ display: "none" }} aria-label="Capture evidence photo" />

      {/* Actions — equal weight */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4, delay: 0.2 }}
        style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: "auto" }}
      >
        {!photoPreview && (
          <motion.button
            className="rs-btn-primary"
            onClick={() => fileRef.current?.click()}
            whileTap={{ scale: 0.97 }}
          >
            <Camera size={20} weight="bold" /> {t("addPhoto")}
          </motion.button>
        )}
        {photoPreview && (
          <motion.button
            className="rs-btn-primary"
            onClick={() => handleContinue(true)}
            whileTap={{ scale: 0.97 }}
          >
            {t("next")} <ArrowRight size={20} weight="bold" />
          </motion.button>
        )}
        <motion.button
          className="rs-btn-ghost"
          onClick={() => handleContinue(false)}
          whileTap={{ scale: 0.97 }}
        >
          {t("skip")}
        </motion.button>
      </motion.div>
    </div>
  );
}
