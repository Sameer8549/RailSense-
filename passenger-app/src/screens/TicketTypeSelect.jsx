import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Ticket, TrainSimple } from "@phosphor-icons/react";
import { useAppStore } from "../store/appStore.js";

const OPTIONS = [
  {
    type: "RESERVED",
    title: "Reserved ticket / PNR",
    body: "I have a PNR, coach or berth details.",
    Icon: Ticket,
  },
  {
    type: "UNRESERVED",
    title: "General / unreserved ticket",
    body: "I have no PNR or fixed berth. Route this to an intercept station.",
    Icon: TrainSimple,
  },
];

export default function TicketTypeSelect() {
  const navigate = useNavigate();
  const draft = useAppStore((s) => s.complaintDraft);
  const updateDraft = useAppStore((s) => s.updateDraft);

  function choose(ticketType) {
    updateDraft({
      ticketType,
      ...(ticketType === "UNRESERVED" ? { pnr: "", coach: "", berth: "" } : {}),
    });
    navigate("/compose");
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
      gap: 22,
    }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 8px", lineHeight: 1.2 }}>
          Do you have a PNR, or is this a general ticket?
        </h1>
        <p style={{ fontSize: 15, color: "var(--rs-text-secondary)", margin: 0, lineHeight: 1.5 }}>
          This decides whether staff should find your coach directly or meet the train at the next usable halt.
        </p>
      </motion.div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {OPTIONS.map(({ type, title, body, Icon }, index) => {
          const selected = draft.ticketType === type;
          return (
            <motion.button
              key={type}
              type="button"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.08, duration: 0.38, delay: index * 0.06 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => choose(type)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "20px",
                borderRadius: "var(--rs-radius-lg)",
                border: selected ? "2px solid var(--rs-blue)" : "2px solid var(--rs-border)",
                background: "var(--rs-surface-card)",
                boxShadow: selected ? "var(--rs-shadow-md)" : "var(--rs-shadow-sm)",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <div style={{
                width: 54,
                height: 54,
                borderRadius: "var(--rs-radius-md)",
                background: "var(--rs-blue-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon size={28} weight="bold" color="var(--rs-blue)" />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "var(--rs-text-primary)", lineHeight: 1.25 }}>
                  {title}
                </div>
                <div style={{ fontSize: 13, color: "var(--rs-text-secondary)", marginTop: 4, lineHeight: 1.45 }}>
                  {body}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
