import { useTransform } from "motion/react";
import { motion } from "motion/react";

/**
 * Live waveform driven by MotionValue amplitude.
 * Never uses useState in the animation loop — all updates go through useTransform.
 */
export default function WaveformBars({ amplitude, barCount = 5, color = "var(--rs-blue)" }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      height: 64,
    }}>
      {Array.from({ length: barCount }, (_, i) => (
        <WaveBar key={i} amplitude={amplitude} index={i} barCount={barCount} color={color} />
      ))}
    </div>
  );
}

function WaveBar({ amplitude, index, barCount, color }) {
  // Each bar gets a slightly different transform so they don't all move identically
  const phase = (index / barCount) * Math.PI;
  const height = useTransform(amplitude, (v) => {
    const scaled = Math.max(4, (v / 255) * 60);
    const variation = 1 + 0.4 * Math.sin(phase + Date.now() * 0.003);
    return Math.min(60, Math.max(4, scaled * variation));
  });

  return (
    <motion.div
      style={{
        width: 5,
        borderRadius: 3,
        background: color,
        height,
        opacity: useTransform(amplitude, [0, 20, 255], [0.3, 0.8, 1]),
      }}
    />
  );
}
