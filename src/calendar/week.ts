/** Weeks are Mondays as YYYY-MM-DD (Bangkok). Pure date maths on the calendar day, no timezones involved. */
const toDate = (d: string) => new Date(`${d}T12:00:00Z`);
const fmt = (d: Date) => d.toISOString().slice(0, 10);

export function mondayOf(day: string): string {
  const d = toDate(day);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return fmt(d);
}

export function shiftWeek(week: string, n: number): string {
  const d = toDate(week);
  d.setUTCDate(d.getUTCDate() + 7 * n);
  return fmt(d);
}

/** "16–20 Nov" (or "27 Oct–31 Oct" across months). */
export function weekLabel(week: string): string {
  const a = toDate(week);
  const b = toDate(shiftWeek(week, 0));
  b.setUTCDate(b.getUTCDate() + 4);
  const mon = (d: Date) => d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  return a.getUTCMonth() === b.getUTCMonth() ? `${a.getUTCDate()}–${b.getUTCDate()} ${mon(b)}` : `${a.getUTCDate()} ${mon(a)}–${b.getUTCDate()} ${mon(b)}`;
}
