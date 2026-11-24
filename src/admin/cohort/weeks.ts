export const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const addDays = (d: string, n: number) => {
  const t = new Date(`${d}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};
const mondayOf = (d: string) => addDays(d, -((new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7));

/** Course weeks (Mon–Fri) from the start date up to today, newest first. */
export function courseWeeks(start: string, today: string): { n: number; from: string; to: string }[] {
  if (!start) return [];
  const out = [];
  for (let m = mondayOf(start), n = 1; m <= today; m = addDays(m, 7), n++) out.push({ n, from: m < start ? start : m, to: addDays(m, 4) });
  return out.reverse();
}

