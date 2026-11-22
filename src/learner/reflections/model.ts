import type { Reflection } from "@/domain/types";
import { reflectionZones } from "@/components/reflection-zones";
import type { ZoneId } from "../today/BarometerFace";

/** One written reflection, flattened for the page. */
export interface Night {
  _id: string;
  day: string; // YYYY-MM-DD (Bangkok)
  zone: ZoneId | undefined;
  barometer: string;
  techHappy: string;
  techImprove: string;
  softHappy: string;
  softImprove: string;
  reply: string;
}

export type Filter = "all" | "reply" | "rough";
export type DayState = "written" | "missed" | "today" | "future" | "off" | "none";

export interface DayCell {
  date: string;
  day: number;
  label: "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
  inMonth: boolean;
  state: DayState;
  night?: Night;
}

const LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const utc = (date: string) => new Date(`${date}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (date: string, n: number) => {
  const d = utc(date);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};
export const mondayOf = (date: string) => addDays(date, -((utc(date).getUTCDay() + 6) % 7));
const isWeekday = (date: string) => {
  const w = utc(date).getUTCDay();
  return w >= 1 && w <= 5;
};

export function zoneOf(barometer: string): ZoneId | undefined {
  const b = (barometer || "").toLowerCase();
  return reflectionZones.find((z) => z.label.toLowerCase() === b || z.aliases.some((a) => a === b))?.id as ZoneId | undefined;
}

export const dayOf = (r: Pick<Reflection, "day" | "date">) => (r.day || r.date || "").slice(0, 10);

/** Newest first, one per day (the first one stored wins). */
export function toNights(reflections: Reflection[]): Night[] {
  const byDay = new Map<string, Night>();
  for (const r of reflections) {
    const day = dayOf(r);
    if (!day || byDay.has(day)) continue;
    byDay.set(day, {
      _id: r._id ?? day,
      day,
      zone: zoneOf(r.reflection?.barometer ?? ""),
      barometer: r.reflection?.barometer ?? "",
      techHappy: r.reflection?.tech_sessions?.happy ?? "",
      techImprove: r.reflection?.tech_sessions?.improve ?? "",
      softHappy: r.reflection?.non_tech_sessions?.happy ?? "",
      softImprove: r.reflection?.non_tech_sessions?.improve ?? "",
      reply: (r.admin_feedback ?? "").trim(),
    });
  }
  return [...byDay.values()].sort((a, b) => (a.day < b.day ? 1 : -1));
}

export function matchesFilter(n: Night, f: Filter): boolean {
  if (f === "reply") return !!n.reply;
  if (f === "rough") return n.zone === "stretch-overwhelmed" || n.zone === "panic";
  return true;
}

function stateOf(date: string, byDay: Map<string, Night>, today: string, holidays: Set<string>, first: string | undefined): DayState {
  if (byDay.has(date)) return "written";
  if (date > today) return "future";
  if (date === today) return "today";
  if (holidays.has(date)) return "off";
  if (!first || date < first) return "none";
  return "missed";
}

const indexByDay = (nights: Night[]) => new Map(nights.map((n) => [n.day, n]));
const firstDay = (nights: Night[]) => (nights.length ? nights[nights.length - 1].day : undefined);

function cell(date: string, i: number, byDay: Map<string, Night>, today: string, holidays: Set<string>, first: string | undefined, month?: number): DayCell {
  return {
    date,
    day: utc(date).getUTCDate(),
    label: LABELS[i],
    inMonth: month === undefined || utc(date).getUTCMonth() === month,
    state: stateOf(date, byDay, today, holidays, first),
    night: byDay.get(date),
  };
}

/** Monday–Friday of this week (a weekend shows the week that just ended). */
export function weekStrip(nights: Night[], today: string, holidays: Set<string>): DayCell[] {
  const byDay = indexByDay(nights);
  const first = firstDay(nights);
  const monday = mondayOf(today);
  return LABELS.map((_, i) => cell(addDays(monday, i), i, byDay, today, holidays, first));
}

/**
 * Mon–Fri rows covering a month (month is 0–11). With a course anchor
 * ({ today, week }) each row is labelled with its course week, e.g. "W9".
 */
export function monthGrid(year: number, month: number, nights: Night[], today: string, holidays: Set<string>, anchor?: { today: string; week: number }) {
  const byDay = indexByDay(nights);
  const first = firstDay(nights);
  const start = mondayOf(iso(new Date(Date.UTC(year, month, 1))));
  const last = iso(new Date(Date.UTC(year, month + 1, 0)));
  const rows: { monday: string; label: string; days: DayCell[] }[] = [];
  for (let monday = start; monday <= last; monday = addDays(monday, 7)) {
    const w = courseWeek(monday, anchor);
    const label = w ? `W${w}` : "";
    rows.push({ monday, label, days: LABELS.map((_, i) => cell(addDays(monday, i), i, byDay, today, holidays, first, month)) });
  }
  return rows;
}

/** Course week number of the week starting on monday, given today's week; 0 when unknown or before the course. */
export function courseWeek(monday: string, anchor?: { today: string; week: number }): number {
  if (!anchor || anchor.week <= 0) return 0;
  const w = anchor.week - Math.round((utc(mondayOf(anchor.today)).getTime() - utc(monday).getTime()) / (7 * 86400000));
  return w > 0 ? w : 0;
}

export function weekRange(monday: string): string {
  const a = utc(monday);
  const b = utc(addDays(monday, 4));
  const am = MONTHS[a.getUTCMonth()];
  const bm = MONTHS[b.getUTCMonth()];
  return am === bm ? `${a.getUTCDate()}–${b.getUTCDate()} ${bm}` : `${a.getUTCDate()} ${am} – ${b.getUTCDate()} ${bm}`;
}

export function groupByWeek(nights: Night[]) {
  const groups: { monday: string; range: string; nights: Night[] }[] = [];
  for (const n of nights) {
    const monday = mondayOf(n.day);
    let g = groups.find((x) => x.monday === monday);
    if (!g) {
      g = { monday, range: weekRange(monday), nights: [] };
      groups.push(g);
    }
    g.nights.push(n);
  }
  return groups.sort((a, b) => (a.monday < b.monday ? 1 : -1));
}

/** Written nights out of class nights (weekdays, not holidays) since the first reflection. Today counts once written. */
export function nightStats(nights: Night[], today: string, holidays: Set<string>) {
  const byDay = indexByDay(nights);
  const first = firstDay(nights);
  const missed: string[] = [];
  let classNights = 0;
  if (first) {
    for (let d = first; d <= today; d = addDays(d, 1)) {
      if (!isWeekday(d) || holidays.has(d)) continue;
      if (d === today && !byDay.has(d)) continue;
      classNights++;
      if (!byDay.has(d)) missed.push(d);
    }
  }
  const counts: Record<ZoneId, number> = { comfort: 0, "stretch-enjoying": 0, "stretch-overwhelmed": 0, panic: 0 };
  let zoned = 0;
  for (const n of nights) {
    if (!n.zone) continue;
    counts[n.zone]++;
    zoned++;
  }
  const mix = Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, zoned ? v / zoned : 0])) as Record<ZoneId, number>;
  const dominant = zoned ? (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as ZoneId) : undefined;
  return { written: nights.length, classNights, missed: missed.reverse(), mix, dominant, replies: nights.filter((n) => n.reply).length };
}

/** Replies the learner hasn't opened yet, newest first. */
export function unseenReplies(nights: Night[], seen: Set<string>): Night[] {
  return nights.filter((n) => n.reply && !seen.has(n._id));
}

/**
 * Parse the stored set of seen reply ids. With nothing stored yet (first visit,
 * or unreadable), every reply there is now counts as seen, so a learner isn't
 * told years-old replies are new.
 */
export function readSeen(raw: string | null, nights: Night[]): Set<string> {
  if (raw !== null) {
    try {
      const v = JSON.parse(raw);
      if (Array.isArray(v)) return new Set(v.filter((x) => typeof x === "string"));
    } catch {
      /* fall through */
    }
  }
  return new Set(nights.filter((n) => n.reply).map((n) => n._id));
}

export interface Answers {
  th: string;
  ti: string;
  sh: string;
  si: string;
}

export const answersComplete = (a: Answers) => [a.th, a.ti, a.sh, a.si].every((s) => s.trim() !== "");
