import { useEffect, useState } from "react";

/**
 * No WebGL: the Farm toggle stays visible but disabled, with a tooltip —
 * ticket 05. Detected once; WebGL support doesn't change mid-session.
 */
export function useWebglSupported(): boolean {
  const [supported] = useState(() => {
    try {
      const canvas = document.createElement("canvas");
      return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      return false;
    }
  });
  return supported;
}

/**
 * Context lost mid-session (driver crash, tab backgrounded, GPU pressure):
 * auto-fall back to the grid with a toast, no dead canvas — ticket 05.
 */
export function useFarmContextLost(onLost: () => void): { lost: boolean; handleContextLost: () => void } {
  const [lost, setLost] = useState(false);

  useEffect(() => {
    if (!lost) return;
    onLost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lost]);

  return { lost, handleContextLost: () => setLost(true) };
}
