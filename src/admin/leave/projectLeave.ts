export type LeaveLevel = "none" | "first" | "second" | "third";
const level = (n: number): LeaveLevel => (n >= 7 ? "third" : n >= 6 ? "second" : n >= 4 ? "first" : "none");

/** Leave used now and after approving a request for `date` (a day that already counts isn't counted twice). */
export function projectLeave(current: number, date: string, countedDates: Set<string>) {
  const after = countedDates.has(date) ? current : current + 1;
  return { now: current, after, level: level(after), reachesLimit: after >= 8 };
}

const COUNTS = new Set(["late", "late_excused", "absent", "absent_excused"]);
export const countedDatesOf = (days: { date: string; status: string }[] = []) => new Set(days.filter((d) => COUNTS.has(d.status)).map((d) => d.date));
