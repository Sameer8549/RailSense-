import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/appStore.js";

/**
 * State machine for complaint flow navigation.
 * Determines which screens are needed based on current draft state.
 */
export function useComplaintFlow() {
  const navigate = useNavigate();
  const draft = useAppStore((s) => s.complaintDraft);

  const needsPNR = () => !draft.pnr || draft.pnr.length < 10;
  const needsCoach = () => !draft.coach;

  const goToFollowUp = () => {
    if (needsPNR() || needsCoach()) {
      navigate("/followup");
    } else {
      navigate("/evidence");
    }
  };

  const afterFollowUp = () => {
    navigate("/evidence");
  };

  return { needsPNR, needsCoach, goToFollowUp, afterFollowUp, draft };
}
