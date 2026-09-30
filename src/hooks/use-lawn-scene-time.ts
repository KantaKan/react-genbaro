import { useEffect, useState } from "react";
import { LAWN_WINDOW_MS } from "@/lib/lawn-planner";

const CARD_OPEN_RETRY_MS = 60_000;

export function useLawnSceneTime(reducedMotion: boolean) {
  const [sceneTime, setSceneTime] = useState(() => Date.now());
  useEffect(() => {
    if (reducedMotion) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (delay: number) => {
      timer = setTimeout(() => {
        if (document.querySelector("[data-lawn-card]")) {
          schedule(CARD_OPEN_RETRY_MS);
          return;
        }
        setSceneTime(Date.now());
        schedule(LAWN_WINDOW_MS - (Date.now() % LAWN_WINDOW_MS));
      }, delay);
    };
    schedule(LAWN_WINDOW_MS - (Date.now() % LAWN_WINDOW_MS));
    return () => clearTimeout(timer);
  }, [reducedMotion]);
  return sceneTime;
}
