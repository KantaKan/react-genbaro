import { useEffect, useState } from "react";
import { bangkokNow } from "../lib/time";

/** Bangkok seconds since midnight, refreshed every intervalMs. */
export function useClock(intervalMs = 15_000): number {
  const [now, setNow] = useState(() => bangkokNow().seconds);
  useEffect(() => {
    const id = setInterval(() => setNow(bangkokNow().seconds), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
