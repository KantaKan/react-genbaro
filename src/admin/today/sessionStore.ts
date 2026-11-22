import { useSyncExternalStore } from "react";
import type { Session } from "../types";

// The side panel renders outside the Today page tree, so the chosen session is shared here.
let current: Session = "morning";
const subs = new Set<() => void>();
export const setPanelSession = (s: Session) => {
  if (s === current) return;
  current = s;
  subs.forEach((f) => f());
};
export const usePanelSession = () =>
  useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => current
  );
