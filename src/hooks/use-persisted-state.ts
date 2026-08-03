import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    const raw = window.localStorage.getItem(key);
    if (raw !== null) {
      try {
        return JSON.parse(raw) as T;
      } catch {
        // fall through to the initial value when the stored JSON is corrupt
      }
    }
    return initialValue;
  });

  useEffect(() => {
    if (state === undefined) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}
