import { OPENS_AT } from "@/learner/reflections/TonightCard";
import type { OverviewDay } from "../../wellbeing";

export type Week = { key: string; label: string; range: string; days: OverviewDay[] };

const utc = (d: string) => new Date(`${d}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Monday of the date's week. */
export function mondayOf(date: string): string {
  const d = utc(date);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return iso(d);
}

function range(monday: string, days: OverviewDay[]) {
  const last = days[0]?.date ?? monday;
  const a = utc(monday);
  const b = utc(last);
  const month = (x: Date) => x.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  return a.getUTCMonth() === b.getUTCMonth() ? `${a.getUTCDate()}-${b.getUTCDate()} ${month(b)}` : `${a.getUTCDate()} ${month(a)}-${b.getUTCDate()} ${month(b)}`;
}

/** Class days grouped by week, newest week first and newest day first, numbered from the first week. */
export function weeksOf(days: OverviewDay[]): Week[] {
  const by = new Map<string, OverviewDay[]>();
  for (const d of days) {
    const k = mondayOf(d.date);
    by.set(k, [...(by.get(k) ?? []), d]);
  }
  const keys = [...by.keys()].sort();
  const start = keys.length ? utc(keys[0]).getTime() : 0;
  return keys
    .map((k) => {
      const list = [...by.get(k)!].sort((a, b) => b.date.localeCompare(a.date));
      return { key: k, label: `Week ${Math.round((utc(k).getTime() - start) / (7 * 864e5)) + 1}`, range: range(k, list), days: list };
    })
    .reverse();
}

export const isRough = (d: OverviewDay) => d.reflection?.zone === "panic" || d.reflection?.zone === "stretch-overwhelmed";
export const isUnreplied = (d: OverviewDay) => !!d.reflection && !d.reflection.reply;
/** Today has no reflection yet before reflections open at 16:30; that is not missing. */
export const isMissing = (d: OverviewDay, today = "", open = true) => !d.extra && !d.reflection && !(d.date === today && !open);

/** Class days that count toward "sent / class days". */
export const classDays = (days: OverviewDay[], today: string, open: boolean) => days.filter((d) => !d.extra && !(d.date === today && !open && !d.reflection));

/** Reflections open at 16:30 Bangkok time. */
export function reflectionsOpen(now = new Date()) {
  const [h, m] = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Bangkok" }).split(":").map(Number);
  return h * 3600 + m * 60 >= OPENS_AT;
}

export function matches(d: OverviewDay, q: string): boolean {
  const r = d.reflection;
  if (!r) return false;
  const text = [r.tech_happy, r.tech_improve, r.nontech_happy, r.nontech_improve, r.reply].join("\n").toLowerCase();
  return text.includes(q.trim().toLowerCase());
}
