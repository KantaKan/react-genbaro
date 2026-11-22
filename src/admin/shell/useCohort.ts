import { useCallback, useSyncExternalStore } from "react";
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

// One shared value for the whole admin, so switching cohort updates every page at once.
let current: number | null = read();
const subs = new Set<() => void>();

/** The cohort the admin is looking at; remembered per browser. */
export function useCohort(): [number, (n: number) => void] {
  const { userData } = useUserData();
  const stored = useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => current
  );
  const set = useCallback((n: number) => {
    current = n;
    try {
      localStorage.setItem(KEY, String(n));
    } catch {
      /* private mode */
    }
    subs.forEach((f) => f());
  }, []);
  return [stored ?? userData?.cohort_number ?? 13, set];
}
