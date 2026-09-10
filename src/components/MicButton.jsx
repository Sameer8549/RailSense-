import { useTransform } from "motion/react";
import { motion, useReducedMotion } from "motion/react";
import { Microphone, StopCircle } from "@phosphor-icons/react";

/**
 * Giant mic button with Apple-design pointer-down feedback.
 * Waveform ring driven by MotionValue amplitude — no useState in animation loop.
 */
export default function MicButton({ amplitude, micState, onPointerDown, onStop }) {
  const reduced = useReducedMotion();

  const ringScale = useTransform(amplitude, [0, 128, 255], [1, 1.12, 1.22]);
  const ringOpacity = useTransform(amplitude, [0, 30, 255], [0, 0.35, 0.6]);

  const isListening = micState === "active";
  const isRequesting = micState === "requesting";

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 120, height: 120 }}>
      {/* Ambient ring — scales with amplitude via MotionValue */}
      {isListening && !reduced && (
        <motion.div
          style={{
            position: "absolute",
            inset: -12,
            borderRadius: "50%",
            background: "var(--rs-blue)",
            scale: ringScale,
            opacity: ringOpacity,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Outer pulse ring during requesting */}
      {isRequesting && !reduced && (
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", inset: -8,
            borderRadius: "50%",
            border: "3px solid var(--rs-blue)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Main button */}
      <motion.button
        onPointerDown={isListening ? onStop : onPointerDown}
        whileTap={!reduced ? { scale: 0.93 } : undefined}
        animate={isListening && !reduced ? {
          boxShadow: [
            "0 0 0 0px hsl(214 85% 52% / 0.4)",
            "0 0 0 16px hsl(214 85% 52% / 0)",
          ]
        } : { boxShadow: "0 0 0 0px hsl(214 85% 52% / 0)" }}
        transition={isListening ? { duration: 1.5, repeat: Infinity } : { duration: 0.2 }}
        aria-label={isListening ? "Stop recording" : "Start recording"}
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          background: isListening ? "var(--rs-blue)" : "var(--rs-surface-card)",
          border: isListening ? "none" : "3px solid var(--rs-blue)",
          color: isListening ? "#fff" : "var(--rs-blue)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "var(--rs-shadow-md)",
          position: "relative",
          zIndex: 1,
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {isListening
          ? <StopCircle size={40} weight="fill" />
          : <Microphone size={40} weight={isRequesting ? "fill" : "bold"} />
        }
      </motion.button>
    </div>
  );
}
