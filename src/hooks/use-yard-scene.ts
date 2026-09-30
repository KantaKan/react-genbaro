import { useState } from "react";
import { DEFAULT_YARD_SCENE, isYardSceneId, type YardSceneId } from "@/lib/lawn-scenes";

const STORAGE_KEY = "baro.lawn.yard-scene";

function readScene(): YardSceneId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isYardSceneId(stored) ? stored : DEFAULT_YARD_SCENE;
  } catch {
    return DEFAULT_YARD_SCENE;
  }
}

export function useYardScene() {
  const [scene, setScene] = useState<YardSceneId>(readScene);
  const choose = (next: YardSceneId) => {
    setScene(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      return;
    }
  };
  return [scene, choose] as const;
}
