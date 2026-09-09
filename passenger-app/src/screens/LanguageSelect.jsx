import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext.jsx";
import { LANGUAGES, LANGUAGE_ORDER } from "../i18n/languages.js";
import { LogoChip } from "../components/AppShell.jsx";

const LANG_GRADIENTS = {
  en: "linear-gradient(135deg, hsl(214 85% 48%), hsl(214 85% 38%))",
  hi: "linear-gradient(135deg, hsl(33 90% 52%), hsl(33 90% 38%))",
  kn: "linear-gradient(135deg, hsl(150 55% 42%), hsl(150 55% 30%))",
  te: "linear-gradient(135deg, hsl(280 55% 52%), hsl(280 55% 38%))",
  ta: "linear-gradient(135deg, hsl(0 72% 50%), hsl(0 72% 38%))",
};

export default function LanguageSelect() {
  const { setLang } = useI18n();
  const navigate = useNavigate();

  function handleSelect(code) {
    setLang(code);
    navigate("/compose");
  }

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      padding: "0 20px 40px",
      background: "var(--rs-surface)",
    }}>
      {/* Header */}
      <div style={{
        paddingTop: "max(env(safe-area-inset-top, 0px), 48px)",
        paddingBottom: 32,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      }}>
        {/* LogoChip — always-white backing, works in light AND dark mode */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
        >
          <LogoChip size={80} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4, delay: 0.15 }}
          style={{ textAlign: "center" }}
        >
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--rs-text-primary)" }}>
            RailSense AI
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 15, color: "var(--rs-text-secondary)" }}>
            Select your language / अपनी भाषा चुनें
          </p>
        </motion.div>
      </div>

      {/* Language cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 480, width: "100%", margin: "0 auto" }}>
        {LANGUAGE_ORDER.map((code, i) => {
          const lang = LANGUAGES[code];
          return (
            <motion.button
              key={code}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.1, duration: 0.45, delay: 0.1 + i * 0.08 }}
              onPointerDown={() => handleSelect(code)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "22px 24px",
                borderRadius: "var(--rs-radius-lg)",
                background: "var(--rs-surface-card)",
                border: "2px solid var(--rs-border)",
                cursor: "pointer",
                textAlign: "left",
                boxShadow: "var(--rs-shadow-sm)",
                touchAction: "manipulation",
              }}
              whileTap={{ scale: 0.97 }}
              whileHover={{ borderColor: "var(--rs-blue)", boxShadow: "var(--rs-shadow-md)" }}
            >
              <div>
                <div style={{
                  fontFamily: lang.fontFamily,
                  fontSize: 26,
                  fontWeight: 700,
                  color: "var(--rs-text-primary)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                }}>
                  {lang.nativeName}
                </div>
                <div style={{
                  fontFamily: '"Geist", system-ui, sans-serif',
                  fontSize: 13,
                  color: "var(--rs-text-secondary)",
                  marginTop: 2,
                  fontWeight: 500,
                }}>
                  {lang.name}
                </div>
              </div>

              {/* Color swatch */}
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: LANG_GRADIENTS[code],
                flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 20, filter: "brightness(10)" }}>
                  {code === "en" ? "A" : code === "hi" ? "अ" : code === "kn" ? "ಅ" : code === "te" ? "అ" : "அ"}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
