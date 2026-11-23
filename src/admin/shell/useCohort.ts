import { useCallback, useSyncExternalStore } from "react";
import { useQuery } from "react-query";
import { useUserData } from "@/UserDataContext";
import { adminApi } from "../api";

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

/** The cohort the admin is looking at; remembered per browser. 0 until one is known. */
export function useCohort(): [number, (n: number) => void] {
  const { userData } = useUserData();
  const list = useQuery(["admin-cohorts"], () => adminApi.cohorts(), { staleTime: 5 * 60_000, retry: false });
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
  const own = userData?.cohort_number ?? 0;
  // Staff accounts have no cohort of their own: start on the newest one.
  const newest = (list.data ?? []).reduce((m, c) => Math.max(m, c.cohort), 0);
  return [stored ?? (own > 0 ? own : newest), set];
}
