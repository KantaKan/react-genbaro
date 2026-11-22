import type { AttendanceStatusType } from "@/domain/types/attendance";

type S = AttendanceStatusType | "";
export const STATUS_LABEL: Record<string, string> = {
  present: "On time",
  late: "Late",
  absent: "Absent",
  late_excused: "Late · excused",
  absent_excused: "On leave",
  holiday: "Holiday",
  no_class: "No class",
  dropout: "Dropped",
  dismissed: "Dismissed",
  "": "Not yet",
};
/** Text colour class for a status dot/label. Colour only for status, never decoration. */
export const statusTone = (s: S) =>
  s === "present" ? "text-emerald-600 dark:text-emerald-400" : s === "late" ? "text-amber-600 dark:text-amber-400" : s === "absent" ? "text-red-600 dark:text-red-400" : s === "late_excused" || s === "absent_excused" ? "text-indigo-600 dark:text-indigo-400" : "text-l-ink3";
/** Soft background chip class for register cells and day squares. */
export const statusChip = (s: S) =>
  s === "present" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : s === "late" ? "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" : s === "absent" ? "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300" : s === "late_excused" || s === "absent_excused" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" : "bg-l-sub text-l-ink3";
export const hhmm = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Bangkok" }) : "");
/** Solid colour for small day squares (last 10 days, profile calendars). */
export const statusSolid = (s: S) =>
  s === "present" ? "bg-emerald-400" : s === "late" ? "bg-amber-400" : s === "absent" ? "bg-red-400" : s === "late_excused" || s === "absent_excused" ? "bg-indigo-400" : "bg-l-sub";
