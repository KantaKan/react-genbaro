import type { StyleId, StyleMeta } from "./registry";

/** Mirrors the backend's StyleUnlocked. */
export function styleUnlocked(m: StyleMeta, streak: number, perfectWeek: boolean): boolean {
  if (m.need === undefined) return true;
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

const KEY = "baro-reroll";

export function readReroll(date: string): number {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null") as { date: string; n: number } | null;
    return v && v.date === date ? v.n : 0;
  } catch {
    return 0;
  }
}

export function bumpReroll(date: string): number {
  const n = readReroll(date) + 1;
  try {
    localStorage.setItem(KEY, JSON.stringify({ date, n }));
  } catch {
    /* storage unavailable: reroll just won't persist */
  }
  return n;
}
