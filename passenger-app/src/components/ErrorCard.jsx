import { motion } from "motion/react";
import { Warning, WifiSlash, Microphone, Camera } from "@phosphor-icons/react";
import { useI18n } from "../i18n/I18nContext.jsx";

const VARIANT_CONFIG = {
  network:    { Icon: WifiSlash,    msgKey: "errorNetwork", color: "var(--rs-error)" },
  mic_denied: { Icon: Microphone,   msgKey: "micPermissionDenied", color: "var(--rs-warning)" },
  ocr_failed: { Icon: Camera,       msgKey: "errorOCR", color: "var(--rs-error)" },
  not_found:  { Icon: Warning,      msgKey: "complaintNotFound", color: "var(--rs-warning)" },
};

export default function ErrorCard({ variant = "network", onRetry }) {
  const { t } = useI18n();
  const { Icon, msgKey, color } = VARIANT_CONFIG[variant] || VARIANT_CONFIG.network;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.3 }}
      className="rs-card"
      style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon size={24} weight="bold" color={color} />
        <p style={{ margin: 0, fontSize: 15, color: "var(--rs-text-primary)", lineHeight: 1.4 }}>
          {t(msgKey)}
        </p>
      </div>
      {onRetry && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onRetry}
          style={{
            background: "var(--rs-blue-light)",
            color: "var(--rs-blue)",
            border: "none",
            borderRadius: "var(--rs-radius-pill)",
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            minHeight: 40,
          }}
        >
          {t("retry")}
        </motion.button>
      )}
    </motion.div>
  );
}
