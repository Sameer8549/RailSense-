import { useRef } from "react";

/**
 * 10-digit auto-advancing OTP-style input for PNR entry.
 * Min 44x56px per box for elderly/one-handed users.
 */
export default function OTPInput({ value = "", onChange, length = 10 }) {
  const refs = useRef([]);
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  function handleChange(i, e) {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    onChange(next.join(""));
    if (char && i < length - 1) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted) {
      onChange(pasted.padEnd(length, "").slice(0, length).replace(/\s/g, ""));
      refs.current[Math.min(pasted.length, length - 1)]?.focus();
    }
    e.preventDefault();
  }

  return (
    <div style={{
      display: "flex",
      gap: 8,
      justifyContent: "center",
      flexWrap: "wrap",
    }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          aria-label={`PNR digit ${i + 1}`}
          style={{
            width: 44,
            minHeight: 56,
            textAlign: "center",
            fontSize: 22,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            background: "var(--rs-surface-2)",
            border: `2px solid ${d ? "var(--rs-blue)" : "var(--rs-border)"}`,
            borderRadius: "var(--rs-radius-md)",
            color: "var(--rs-text-primary)",
            outline: "none",
            caretColor: "var(--rs-blue)",
            transition: "border-color 0.15s ease",
          }}
        />
      ))}
    </div>
  );
}
