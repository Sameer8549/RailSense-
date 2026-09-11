import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/appStore.js";

/**
 * State machine for complaint flow navigation.
 * Determines which screens are needed based on current draft state.
 */
export function useComplaintFlow() {
  const navigate = useNavigate();
  const draft = useAppStore((s) => s.complaintDraft);

  const isUnreserved = () => draft.ticketType === "UNRESERVED";
  const needsPNR = () => !isUnreserved() && (!draft.pnr || draft.pnr.length < 10);
  const needsCoach = () => !isUnreserved() && !draft.coach;

  const goToFollowUp = () => {
    if (isUnreserved() || needsPNR() || needsCoach()) {
      navigate("/followup");
    } else {
      navigate("/evidence");
    }
  };

  const afterFollowUp = () => {
    navigate("/evidence");
  };

  return { isUnreserved, needsPNR, needsCoach, goToFollowUp, afterFollowUp, draft };
}
