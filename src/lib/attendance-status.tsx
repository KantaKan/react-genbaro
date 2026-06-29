import type { AttendanceStatusType } from "@/domain/types";

export const STATUS_CYCLE: AttendanceStatusType[] = ["present", "late", "absent"];

export const STATUS_CYCLE_MAP: Record<AttendanceStatusType, AttendanceStatusType> = {
  present: "late",
  late: "absent",
  absent: "present",
  late_excused: "present",
  absent_excused: "present",
  no_class: "present",
  holiday: "present",
  dropout: "present",
  dismissed: "present",
};

export function cycleStatus(current: AttendanceStatusType): AttendanceStatusType {
  const next = STATUS_CYCLE_MAP[current];
  return next ?? "present";
}

export function getStatusColor(status: string, dark = false): string {
  const prefix = dark ? "hsl(var(--register-stamp-" : "hsl(var(--register-stamp-";
  switch (status) {
    case "present": return `${prefix}present))`;
    case "late": return `${prefix}late))`;
    case "absent": return `${prefix}absent))`;
    case "late_excused": case "absent_excused": return `${prefix}excused))`;
    case "no_class": return `${prefix}no-class))`;
    case "holiday": return `${prefix}holiday))`;
    case "dropout": return `${prefix}dropout))`;
    case "dismissed": return `${prefix}dismissed))`;
    default: return "currentColor";
  }
}

export function getStatusBgClass(status: string): string {
  switch (status) {
    case "present": return "bg-[hsl(var(--register-stamp-present) / 0.08)]";
    case "late": return "bg-[hsl(var(--register-stamp-late) / 0.08)]";
    case "absent": return "bg-[hsl(var(--register-stamp-absent) / 0.08)]";
    case "late_excused": case "absent_excused": return "bg-[hsl(var(--register-stamp-excused) / 0.08)]";
    case "no_class": return "bg-[hsl(var(--register-stamp-no-class) / 0.08)]";
    default: return "bg-transparent";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "present": return "Present";
    case "late": return "Late";
    case "absent": return "Absent";
    case "late_excused": return "Late Exc";
    case "absent_excused": return "Absent Exc";
    case "no_class": return "No Class";
    case "holiday": return "Holiday";
    case "dropout": return "Dropout";
    case "dismissed": return "Dismissed";
    default: return "—";
  }
}
