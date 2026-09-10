import { motion } from "motion/react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sun, Moon, Globe } from "@phosphor-icons/react";
import { useI18n } from "../i18n/I18nContext.jsx";
import { useAppStore } from "../store/appStore.js";

const SCREEN_TITLES = {
  "/":              null,
  "/compose":       null,
  "/understanding": null,
  "/followup":      null,
  "/evidence":      null,
  "/confirm":       null,
  "/done":          null,
  "/track":         "trackYourComplaint",
};

/**
 * Logo chip — always renders on an explicitly white backing so the
 * dark-navy mark has guaranteed contrast in both light and dark mode.
 * The white square is intentional framing, not bleeding from the PNG background.
 */
function LogoChip({ size = 32 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.22),
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
        boxShadow: "0 1px 4px hsl(220 20% 12% / 0.18), 0 0 0 1px hsl(220 14% 88% / 0.6)",
      }}
    >
      <img
        src="/app/logo.png"
        alt="RailSense AI"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
}

export { LogoChip };

export default function AppShell({ children }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);

  const isLanguageSelect = location.pathname === "/";
  const titleKey = SCREEN_TITLES[location.pathname];

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      {/* Translucent top bar */}
      {!isLanguageSelect && (
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.35 }}
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            background: darkMode
              ? "hsl(220 18% 10% / 0.88)"
              : "hsl(220 20% 97% / 0.88)",
            borderBottom: "1px solid var(--rs-border)",
            padding: "0 16px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {/* Logo chip + optional title */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoChip size={36} />
            {titleKey && (
              <span style={{
                fontSize: 17, fontWeight: 600,
                color: "var(--rs-text-primary)", letterSpacing: "-0.01em",
              }}>
                {t(titleKey)}
              </span>
            )}
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {/* Language switcher */}
            {lang && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate("/")}
                aria-label={t("changeLanguage")}
                title={t("changeLanguage")}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: "var(--rs-surface-2)",
                  border: "1px solid var(--rs-border)",
                  borderRadius: "var(--rs-radius-pill)",
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontSize: 13, fontWeight: 600,
                  color: "var(--rs-text-secondary)",
                  minHeight: 36, minWidth: 36,
                }}
              >
                <Globe size={16} weight="bold" />
                <span style={{ textTransform: "uppercase" }}>{lang}</span>
              </motion.button>
            )}

            {/* Track shortcut */}
            {location.pathname !== "/track" && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate("/track")}
                aria-label="Track complaint"
                style={{
                  background: "transparent", border: "none",
                  borderRadius: "var(--rs-radius-pill)",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: 13, fontWeight: 600,
                  color: "var(--rs-blue)",
                  minHeight: 36,
                }}
              >
                Track
              </motion.button>
            )}

            {/* Dark mode toggle */}
            <motion.button
              whileTap={{ scale: 0.88, rotate: 15 }}
              onClick={toggleDarkMode}
              aria-label={darkMode ? t("lightMode") : t("darkMode")}
              title={darkMode ? t("lightMode") : t("darkMode")}
              style={{
                background: "transparent", border: "none",
                borderRadius: "var(--rs-radius-pill)",
                padding: 8,
                cursor: "pointer",
                color: "var(--rs-text-secondary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                minHeight: 36, minWidth: 36,
              }}
            >
              {darkMode
                ? <Sun size={20} weight="bold" />
                : <Moon size={20} weight="bold" />
              }
            </motion.button>
          </div>
        </motion.header>
      )}

      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </main>
    </div>
  );
}
