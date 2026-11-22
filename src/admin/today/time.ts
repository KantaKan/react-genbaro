import type { CheckinRules } from "@/learner/types";
import type { Session } from "../types";

/** Minutes since midnight in Bangkok for a Date. */
export const bkkMinutes = (d: Date) => {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
  return Number(p.find((x) => x.type === "hour")!.value) * 60 + Number(p.find((x) => x.type === "minute")!.value);
};
export const clockMin = (c: { h: number; m: number }) => c.h * 60 + c.m;
export const fmtClock = (c: { h: number; m: number }) => `${c.h}:${String(c.m).padStart(2, "0")}`;
export type Phase = "before" | "on_time" | "late" | "closed";
export function phaseOf(rules: CheckinRules, s: Session, now: number): Phase {
  const w = rules[s];
  if (now < clockMin(w.open_at)) return "before";
  if (now <= clockMin(w.late_after)) return "on_time";
  if (now <= clockMin(w.absent_after)) return "late";
  return "closed";
}

/** Today's date in Bangkok, YYYY-MM-DD. */
export const bkkToday = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(d);

/** Which session the clock is in (afternoon from its open time). */
export const currentSession = (rules: CheckinRules, nowMin: number): Session => (nowMin >= clockMin(rules.afternoon.open_at) ? "afternoon" : "morning");

/** Poll fast inside either check-in window on a class day; slowly otherwise (to catch a new day). */
export function liveInterval(rules: CheckinRules, nowMin: number, classDay: boolean): number {
  if (!classDay) return 60_000;
  const inWin = (s: Session) => nowMin >= clockMin(rules[s].open_at) && nowMin <= clockMin(rules[s].absent_after);
  return inWin("morning") || inWin("afternoon") ? 15_000 : 60_000;
}
