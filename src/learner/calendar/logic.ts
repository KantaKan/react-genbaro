import { toMin, type CalDay, type CalWeek, type Session } from "@/calendar/types";

const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** The published week to show: the one containing today, else the next one coming, else the last. */
export function pickWeek(weeks: CalWeek[], today: string): CalWeek | undefined {
  const sorted = [...weeks].sort((a, b) => a.monday.localeCompare(b.monday));
  const current = sorted.find((w) => w.monday <= today && today <= addDays(w.monday, 6));
  return current ?? sorted.find((w) => w.monday > today) ?? sorted[sorted.length - 1];
}

/** Today if it falls in the week, otherwise the week's first day. */
export function defaultDay(week: CalWeek, today: string): string {
  return week.days.some((d) => d.date === today) ? today : (week.days[0]?.date ?? week.monday);
}

export type Moment = { now?: Session; next?: Session; minsLeft?: number; minsToNext?: number };

/** What's on at this minute of the day, and what comes next (breaks never count as a session). */
export function momentAt(day: CalDay | undefined, min: number): Moment {
  if (!day) return {};
  const sessions = day.sessions.filter((s) => s.kind === "session");
  const now = sessions.find((s) => toMin(s.start) <= min && min < toMin(s.end));
  const next = sessions.find((s) => toMin(s.start) > min);
  const out: Moment = {};
  if (now) {
    out.now = now;
    out.minsLeft = toMin(now.end) - min;
  }
  if (next) {
    out.next = next;
    out.minsToNext = toMin(next.start) - min;
  }
  return out;
}

/** Minutes per session type over a week, biggest first (breaks left out). */
export function hoursByType(week: CalWeek): { type: string; minutes: number }[] {
  const sum = new Map<string, number>();
  for (const d of week.days)
    for (const s of d.sessions)
      if (s.kind === "session") sum.set(s.type, (sum.get(s.type) ?? 0) + toMin(s.end) - toMin(s.start));
  return [...sum.entries()].map(([type, minutes]) => ({ type, minutes })).sort((a, b) => b.minutes - a.minutes);
}

/** Sessions still to come this week (30 minutes or longer, so the daily opening doesn't crowd the list). */
export function upcoming(week: CalWeek, today: string, min: number, limit: number): { date: string; session: Session }[] {
  const out: { date: string; session: Session }[] = [];
  for (const d of week.days) {
    if (d.date < today || d.holiday) continue;
    for (const s of d.sessions) {
      if (s.kind !== "session" || toMin(s.end) - toMin(s.start) < 30) continue;
      if (d.date === today && toMin(s.start) <= min) continue;
      out.push({ date: d.date, session: s });
    }
  }
  return out.slice(0, limit);
}

export function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
