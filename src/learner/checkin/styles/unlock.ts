import type { StyleId, StyleMeta } from "./registry";

/** Mirrors the backend's StyleUnlocked. */
export function styleUnlocked(m: StyleMeta, streak: number, perfectWeek: boolean, champion = false): boolean {
  if (m.need === undefined) return true;
  if (m.need === "champion") return champion;
  if (m.need === "perfect_week") return perfectWeek;
  return streak >= m.need;
}

export function unlockProgress(m: StyleMeta, streak: number): { have: number; need: number } | null {
  return typeof m.need === "number" ? { have: Math.min(streak, m.need), need: m.need } : null;
}

function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** One style per learner per day, stable across reloads; `reroll` shifts it. */
export function dailyStyle(unlocked: StyleId[], date: string, seed: string, reroll: number): StyleId {
  if (unlocked.length === 0) return "slide";
  return unlocked[fnv1a(`${seed}|${date}|${reroll}`) % unlocked.length];
}

/** Per-learner keys so learners sharing a browser don't use up each other's reroll. */
const key = (name: string, seed: string) => (seed ? `baro-${name}:${seed}` : `baro-${name}`);

export function readReroll(date: string, seed = ""): number {
  try {
    const v = JSON.parse(localStorage.getItem(key("reroll", seed)) || "null") as { date: string; n: number } | null;
    return v && v.date === date ? v.n : 0;
  } catch {
    return 0;
  }
}

export function bumpReroll(date: string, seed = ""): number {
  const n = readReroll(date, seed) + 1;
  try {
    localStorage.setItem(key("reroll", seed), JSON.stringify({ date, n }));
  } catch {
    /* storage unavailable: reroll just won't persist */
  }
  return n;
}

/** Today's random pick is pinned so a mid-day streak change doesn't swap the style. */
export function readDailyPick(date: string, seed: string, reroll: number): StyleId | null {
  try {
    const v = JSON.parse(localStorage.getItem(key("daily", seed)) || "null") as { date: string; reroll: number; id: StyleId } | null;
    return v && v.date === date && v.reroll === reroll ? v.id : null;
  } catch {
    return null;
  }
}

export function writeDailyPick(date: string, seed: string, reroll: number, id: StyleId) {
  try {
    localStorage.setItem(key("daily", seed), JSON.stringify({ date, reroll, id }));
  } catch {
    /* ignore */
  }
}
