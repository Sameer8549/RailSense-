import { motion } from "motion/react";
import { useReducedMotion } from "motion/react";

export default function SkeletonLoader({ lines = 3, height = 20, gap = 12 }) {
  const reduced = useReducedMotion();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          style={{
            height,
            borderRadius: "var(--rs-radius-sm)",
            background: "var(--rs-surface-2)",
            overflow: "hidden",
            width: i === lines - 1 ? "60%" : "100%",
          }}
        >
          {!reduced && (
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 }}
              style={{
                height: "100%",
                background: "linear-gradient(90deg, transparent, var(--rs-surface-card), transparent)",
                width: "60%",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
