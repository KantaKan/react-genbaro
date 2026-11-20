import type { AttendanceRecord, AttendanceStatusType } from "@/domain/types";

export type CellStatus = AttendanceStatusType | "none" | null;

export interface Cell {
  date: string | null;
  day: number;
  weekend: boolean;
  future: boolean;
  isToday: boolean;
  am: CellStatus;
  pm: CellStatus;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Monday-first month grid. Past weekdays without a record are "none" (no class / not recorded). */
export function monthGrid(year: number, month0: number, history: AttendanceRecord[], today: string): Cell[] {
  const first = new Date(Date.UTC(year, month0, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const cells: Cell[] = Array.from({ length: lead }, () => ({ date: null, day: 0, weekend: false, future: false, isToday: false, am: null, pm: null }));
  for (let d = 1; d <= days; d++) {
    const date = `${year}-${pad(month0 + 1)}-${pad(d)}`;
    const wd = new Date(Date.UTC(year, month0, d)).getUTCDay();
    const weekend = wd === 0 || wd === 6;
    const future = date > today;
    const find = (s: "morning" | "afternoon"): CellStatus => {
      const r = history.find((x) => x.date === date && x.session === s && !x.deleted);
      if (r) return r.status;
      return future || weekend || date === today ? null : "none";
    };
    cells.push({ date, day: d, weekend, future, isToday: date === today, am: find("morning"), pm: find("afternoon") });
  }
  return cells;
}
