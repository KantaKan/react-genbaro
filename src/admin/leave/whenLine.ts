import type { LeaveRequest } from "@/domain/types/attendance";

/** "Thu 26 Nov · full day" / "· morning" / "· afternoon" / "· late arrival". */
export function whenLine(r: Pick<LeaveRequest, "date" | "type" | "session">): string {
  const d = new Date(`${r.date}T12:00:00+07:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Bangkok" });
  const part = r.type === "full_day" ? "full day" : r.type === "late" ? "late arrival" : r.session === "afternoon" ? "afternoon" : r.session === "morning" ? "morning" : "half day";
  return `${d} · ${part}`;
}
