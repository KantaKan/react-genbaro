import type { CreateLeaveRequestPayload } from "@/domain/types";

export type LeaveKind = "absent" | "late";
export type LeavePart = "morning" | "afternoon" | "full";

const ALLOWANCE = 8;

export function leaveImpact(kind: LeaveKind, part: LeavePart, used: number): string {
  const what = kind === "late" ? "Late · Excused" : "Absent · Excused";
  const when = part === "full" ? "" : ` for the ${part}`;
  const after = used + 1;
  const tail = after > ALLOWANCE ? "You'd be over the limit — a TA will talk to you." : `You'd have ${ALLOWANCE - after} left.`;
  return `If approved, this counts as ${what}${when} and uses 1 of your ${ALLOWANCE} days. ${tail}`;
}

export function toLeavePayload(kind: LeaveKind, part: LeavePart, date: string, reason: string, note: string): CreateLeaveRequestPayload {
  const text = note.trim() ? `${reason} — ${note.trim()}` : reason;
  if (kind === "late") return { type: "late", session: part === "afternoon" ? "afternoon" : "morning", date, reason: text };
  if (part === "full") return { type: "full_day", date, reason: text };
  return { type: "half_day", session: part, date, reason: text };
}
