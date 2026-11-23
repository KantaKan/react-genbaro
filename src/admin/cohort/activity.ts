const STATUS: Record<string, string> = { present: "present", late: "late", absent: "absent", absent_excused: "excused", approved: "approved", rejected: "declined" };

/** "Mint", "Mint and Ploy", "Mint, Ploy and 3 more". */
export const forWhom = (names: string[]) =>
  names.length <= 2 ? names.join(" and ") : `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;

/** The safe facts the server kept, as a short phrase: "Tue 24 Nov, morning → late". */
export function factLine(f?: Record<string, string>): string {
  if (!f) return "";
  const when = [f.date && new Date(`${f.date}T12:00:00+07:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Bangkok" }), f.session].filter(Boolean).join(", ");
  const what = f.status ? STATUS[f.status] ?? f.status : f.points ? `${f.points} pts${f.group ? ` to ${f.group}` : ""}` : "";
  return [when, what].filter(Boolean).join(" → ");
}
