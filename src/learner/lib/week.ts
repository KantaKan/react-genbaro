import type { AttendanceRecord, AttendanceStatusType } from "@/domain/types";

export interface WeekCell {
  date: string;
  label: "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
  day: number;
  am: AttendanceStatusType | null;
  pm: AttendanceStatusType | null;
  isToday: boolean;
  future: boolean;
}

const LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Monday–Friday of the week containing todayDate (a weekend shows the week that just ended). */
export function weekCells(history: AttendanceRecord[], todayDate: string): WeekCell[] {
  const t = new Date(`${todayDate}T00:00:00Z`);
  const dow = (t.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  const monday = new Date(t);
  monday.setUTCDate(t.getUTCDate() - dow);
  return LABELS.map((label, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    const date = iso(d);
    const find = (s: "morning" | "afternoon") => history.find((r) => r.date === date && r.session === s && !r.deleted)?.status ?? null;
    return { date, label, day: d.getUTCDate(), am: find("morning"), pm: find("afternoon"), isToday: date === todayDate, future: date > todayDate };
  });
}
