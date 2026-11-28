import type { Reflection } from "@/domain/types";
import { reflectionZones } from "@/components/reflection-zones";
import { decodeHtmlEntities } from "@/lib/board";
import { bangkokNow } from "../lib/time";
import { nicknames } from "../lib/name";
import type { AvatarConfig } from "../avatar/types";
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
  replyBy: string; // staff user id, "" for older replies
  replyName: string; // their nickname, "" when unknown
  replyAvatar?: AvatarConfig | null; // the avatar they had when replying
}

export type Filter = "all" | "reply" | "rough";
export type DayState = "written" | "missed" | "protected" | "today" | "future" | "off" | "none";

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

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The reflection's Bangkok date, or "" when it has none worth trusting. */
export function dayOf(r: Pick<Reflection, "day" | "date">): string {
  let day = r.day && DAY.test(r.day) ? r.day : "";
  if (!day && r.date) {
    const t = new Date(r.date);
    if (!Number.isNaN(t.getTime())) day = bangkokNow(t).date;
  }
  return day && day >= "2020-01-01" ? day : "";
}
const text = (s: string | undefined) => decodeHtmlEntities(s ?? "");

/** Newest first, one per day (the first one stored wins). */
export function toNights(reflections: Reflection[]): Night[] {
  const byDay = new Map<string, Night>();
  for (const r of reflections) {
    const day = dayOf(r);
    if (!day || byDay.has(day)) continue;
    byDay.set(day, {
      _id: r._id ?? day,
      day,
      zone: zoneOf(text(r.reflection?.barometer)),
      barometer: text(r.reflection?.barometer),
      techHappy: text(r.reflection?.tech_sessions?.happy),
      techImprove: text(r.reflection?.tech_sessions?.improve),
      softHappy: text(r.reflection?.non_tech_sessions?.happy),
      softImprove: text(r.reflection?.non_tech_sessions?.improve),
      reply: text(r.admin_feedback).trim(),
      replyBy: r.admin_feedback_by ?? "",
      replyName: replierName(r.admin_feedback_name),
      replyAvatar: r.admin_feedback_avatar ?? null,
    });
  }
  return [...byDay.values()].sort((a, b) => (a.day < b.day ? 1 : -1));
}

export function matchesFilter(n: Night, f: Filter): boolean {
  if (f === "reply") return !!n.reply;
  if (f === "rough") return n.zone === "stretch-overwhelmed" || n.zone === "panic";
  return true;
}

function stateOf(date: string, byDay: Map<string, Night>, today: string, holidays: Set<string>, first: string | undefined, protectedDays: Set<string>): DayState {
  if (byDay.has(date)) return "written";
  if (date > today) return "future";
  if (date === today) return "today";
  if (holidays.has(date)) return "off";
  if (protectedDays.has(date)) return "protected";
  if (!first || date < first) return "none";
  return "missed";
}

const indexByDay = (nights: Night[]) => new Map(nights.map((n) => [n.day, n]));
const firstDay = (nights: Night[]) => (nights.length ? nights[nights.length - 1].day : undefined);

function cell(date: string, i: number, byDay: Map<string, Night>, today: string, holidays: Set<string>, first: string | undefined, protectedDays: Set<string>, month?: number): DayCell {
  return {
    date,
    day: utc(date).getUTCDate(),
    label: LABELS[i],
    inMonth: month === undefined || utc(date).getUTCMonth() === month,
    state: stateOf(date, byDay, today, holidays, first, protectedDays),
    night: byDay.get(date),
  };
}

/** Monday–Friday of this week (a weekend shows the week that just ended). */
export function weekStrip(nights: Night[], today: string, holidays: Set<string>, protectedDays: Set<string> = new Set()): DayCell[] {
  const byDay = indexByDay(nights);
  const first = firstDay(nights);
  const monday = mondayOf(today);
  return LABELS.map((_, i) => cell(addDays(monday, i), i, byDay, today, holidays, first, protectedDays));
}

export interface Course {
  start: string; // YYYY-MM-DD
  days: number; // class days in the course
}

/** Same rule as the server (CourseProgress): weekdays from the start are days 1..days, five to a week. 0 outside the course. */
export function courseWeekOf(date: string, start: string, days: number): number {
  if (!DAY.test(start) || days <= 0 || date < start || !isWeekday(date)) return 0;
  let n = 0;
  for (let d = start; d <= date; d = addDays(d, 1)) if (isWeekday(d)) n++;
  return n > days ? 0 : Math.floor((n - 1) / 5) + 1;
}

/** Course week shown for a Mon–Fri row: the latest of its days that is inside the course. */
export function rowWeek(monday: string, course?: Course): number {
  if (!course) return 0;
  for (let i = 4; i >= 0; i--) {
    const w = courseWeekOf(addDays(monday, i), course.start, course.days);
    if (w) return w;
  }
  return 0;
}

/** Mon–Fri rows for a month (month is 0–11); a row with no day in the month is left out. */
export function monthGrid(year: number, month: number, nights: Night[], today: string, holidays: Set<string>, protectedDays: Set<string> = new Set(), course?: Course) {
  const byDay = indexByDay(nights);
  const first = firstDay(nights);
  const firstOfMonth = iso(new Date(Date.UTC(year, month, 1)));
  const last = iso(new Date(Date.UTC(year, month + 1, 0)));
  const rows: { monday: string; label: string; days: DayCell[] }[] = [];
  for (let monday = mondayOf(firstOfMonth); monday <= last; monday = addDays(monday, 7)) {
    if (addDays(monday, 4) < firstOfMonth) continue;
    const w = rowWeek(monday, course);
    rows.push({ monday, label: w ? `W${w}` : "", days: LABELS.map((_, i) => cell(addDays(monday, i), i, byDay, today, holidays, first, protectedDays, month)) });
  }
  return rows;
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
export function nightStats(nights: Night[], today: string, holidays: Set<string>, protectedDays: Set<string> = new Set()) {
  const byDay = indexByDay(nights);
  const first = firstDay(nights);
  const missed: string[] = [];
  let classNights = 0;
  let written = 0;
  if (first) {
    for (let d = first; d <= today; d = addDays(d, 1)) {
      if (!isWeekday(d) || holidays.has(d)) continue;
      if (byDay.has(d)) {
        classNights++;
        written++;
      } else if (d !== today && !protectedDays.has(d)) {
        classNights++;
        missed.push(d);
      }
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
  return { written, classNights, missed: missed.reverse(), mix, dominant, replies: nights.filter((n) => n.reply).length };
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

/** A replier's nickname from their Zoom name ("00_Kan(Kan/กัน)" → "Kan", "05_Neeti(นีติ)" → "นีติ", "07_Ploy" → "Ploy"). */
export function replierName(raw: string | undefined): string {
  const name = (raw ?? "").trim();
  if (!name) return "";
  const bare = name.replace(/^\d+_/, "");
  if (!name.includes("(")) return bare;
  const n = nicknames(name, "");
  return n.en || n.th || bare.replace(/\(.*$/, "").trim();
}

/** Who these replies are from: "Kan", "Kan and Neeti", else "your TAs" (3+ people, or any reply without a name). */
export function repliesFrom(nights: Night[]): string {
  const names = [...new Set(nights.map((n) => n.replyName))];
  if (names.length === 0 || names.length > 2 || names.includes("")) return "your TAs";
  return names.join(" and ");
}
