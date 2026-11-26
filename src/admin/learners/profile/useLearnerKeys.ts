import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const editable = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

/** J / K open the next / previous learner of the cohort. */
export function useLearnerKeys(prev: string | null, next: string | null) {
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || editable(e.target)) return;
      const to = e.key === "j" ? next : e.key === "k" ? prev : null;
      if (to) navigate(`/admin/learners/${to}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, navigate]);
}
