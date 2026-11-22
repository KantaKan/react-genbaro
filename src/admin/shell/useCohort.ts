import { useCallback, useState } from "react";
import { useUserData } from "@/UserDataContext";

const KEY = "baro-admin-cohort";

function read(): number | null {
  try {
    const v = Number(localStorage.getItem(KEY));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

/** The cohort the admin is looking at; remembered per browser. */
export function useCohort(): [number, (n: number) => void] {
  const { userData } = useUserData();
  const [stored, setStored] = useState<number | null>(read);
  const set = useCallback((n: number) => {
    setStored(n);
    try {
      localStorage.setItem(KEY, String(n));
    } catch {
      /* private mode */
    }
  }, []);
  return [stored ?? userData?.cohort_number ?? 13, set];
}
