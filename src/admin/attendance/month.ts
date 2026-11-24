import type { RegisterView } from "../types";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (date: string) => new Date(`${date}T12:00:00Z`);

/** Mondays of the weeks that touch the month (YYYY-MM). */
export function monthMondays(month: string): string[] {
  const first = utc(`${month}-01`);
  const start = new Date(first);
  start.setUTCDate(first.getUTCDate() - ((first.getUTCDay() + 6) % 7));
  const out: string[] = [];
  for (const d = start; d.toISOString().slice(0, 7) <= month; d.setUTCDate(d.getUTCDate() + 7)) out.push(iso(d));
  return out;
}

export const shiftMonth = (month: string, n: number) => {
  const d = utc(`${month}-15`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
};

export type DayStats = { date: string; holiday: boolean; present: number; late: number; excused: number; absent: number; unmarked: number };

/** Per class day: who was there, late, excused, absent, and how many sessions nobody has marked yet. */
export function dayStats(weeks: RegisterView[]): Map<string, DayStats> {
  const out = new Map<string, DayStats>();
  for (const v of weeks) {
    v.dates.forEach((date, i) => {
      const s: DayStats = { date, holiday: v.holidays.includes(date), present: 0, late: 0, excused: 0, absent: 0, unmarked: 0 };
      if (!s.holiday) {
        for (const l of v.learners) {
          for (const c of l.days[i] ?? []) {
            const st = c?.status ?? "";
            if (st === "present") s.present++;
            else if (st === "late" || st === "late_excused") s.late++;
            else if (st === "absent_excused") s.excused++;
            else if (st === "absent") s.absent++;
            else if (st === "") s.unmarked++;
          }
        }
      }
      out.set(date, s);
    });
  }
  return out;
}

/** Share of marked sessions where the learner showed up (present or late). Null when nothing is marked. */
export function attendedRate(s: DayStats): number | null {
  const marked = s.present + s.late + s.excused + s.absent;
  return marked ? (s.present + s.late) / marked : null;
}
