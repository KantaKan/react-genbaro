import type { CheckinRules, Clock, SessionName, SessionWindow } from "../types";

export type Phase = "not_open" | "on_time" | "late" | "closed";

const fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** Current date and time of day in Bangkok, whatever the device timezone. */
export function bangkokNow(d: Date = new Date()): { date: string; minutes: number; seconds: number } {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  const h = Number(p.hour), m = Number(p.minute), s = Number(p.second);
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: h * 60 + m, seconds: h * 3600 + m * 60 + s };
}

const sec = (c: Clock) => c.h * 3600 + c.m * 60;

/** Same boundaries as the server: on time while now <= late_after:00, late while <= absent_after:00. */
export function phaseAt(w: SessionWindow, nowSec: number): Phase {
  if (nowSec < sec(w.open_at)) return "not_open";
  if (nowSec <= sec(w.late_after)) return "on_time";
  if (nowSec <= sec(w.absent_after)) return "late";
  return "closed";
}

export function sessionAt(r: CheckinRules, nowSec: number): SessionName {
  return nowSec >= sec(r.afternoon.open_at) ? "afternoon" : "morning";
}

export function minutesUntil(c: Clock, nowSec: number): number {
  return Math.max(0, Math.ceil((sec(c) - nowSec) / 60));
}

export function fmtClock(c: Clock): string {
  return `${c.h}:${String(c.m).padStart(2, "0")}`;
}
