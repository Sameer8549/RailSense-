import { motion } from "motion/react";
import {
  Thermometer, Broom, CurrencyDollar, Warning, Toilet, 
  ForkKnife, SecurityCamera, FirstAid, Question
} from "@phosphor-icons/react";

const ISSUE_ICONS = {
  ac: Thermometer,
  dirty: Broom,
  overcharging: CurrencyDollar,
  safety: SecurityCamera,
  toilet: Toilet,
  food: ForkKnife,
  medical: FirstAid,
  other: Question,
  default: Warning,
};

const ISSUE_COLORS = {
  ac:          { bg: "hsl(210 85% 93%)", text: "hsl(210 85% 35%)" },
  dirty:       { bg: "hsl(38 90% 93%)",  text: "hsl(38 90% 30%)"  },
  overcharging:{ bg: "hsl(0 72% 93%)",   text: "hsl(0 72% 38%)"   },
  safety:      { bg: "hsl(280 60% 93%)", text: "hsl(280 60% 35%)" },
  toilet:      { bg: "hsl(150 55% 93%)", text: "hsl(150 55% 28%)" },
  food:        { bg: "hsl(33 85% 93%)",  text: "hsl(33 85% 30%)"  },
  medical:     { bg: "hsl(0 72% 93%)",   text: "hsl(0 72% 38%)"   },
  other:       { bg: "hsl(220 14% 93%)", text: "hsl(220 14% 35%)" },
  default:     { bg: "hsl(214 85% 93%)", text: "hsl(214 85% 38%)" },
};

function guessCategory(label) {
  const l = label.toLowerCase();
  if (l.includes("ac") || l.includes("cold") || l.includes("hot") || l.includes("temperature")) return "ac";
  if (l.includes("dirty") || l.includes("clean") || l.includes("garbage")) return "dirty";
  if (l.includes("charg") || l.includes("price") || l.includes("money") || l.includes("overcharge")) return "overcharging";
  if (l.includes("safe") || l.includes("thef") || l.includes("danger")) return "safety";
  if (l.includes("toilet") || l.includes("bathroom") || l.includes("washroom")) return "toilet";
  if (l.includes("food") || l.includes("meal") || l.includes("eat")) return "food";
  return "default";
}

export default function IssueTag({ label, onRemove, index = 0 }) {
  const cat = guessCategory(label);
  const Icon = ISSUE_ICONS[cat] || ISSUE_ICONS.default;
  const colors = ISSUE_COLORS[cat] || ISSUE_COLORS.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0.15, duration: 0.45, delay: index * 0.18 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: colors.bg,
        color: colors.text,
        borderRadius: "var(--rs-radius-pill)",
        padding: "10px 16px",
        fontSize: 15,
        fontWeight: 600,
        border: `1px solid ${colors.text}22`,
      }}
    >
      <Icon size={18} weight="bold" />
      <span>{label}</span>
      {onRemove && (
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onRemove}
          style={{
            background: "transparent", border: "none",
            cursor: "pointer", padding: 2,
            color: colors.text, display: "flex",
            alignItems: "center", marginLeft: 4,
          }}
          aria-label={`Remove ${label}`}
        >
          ✕
        </motion.button>
      )}
    </motion.div>
  );
}
