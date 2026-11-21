import { Eye, CalendarClock, UserX } from "lucide-react";
import type { AttendanceStatusType } from "@/domain/types";
import { getStatusBgClass } from "@/lib/attendance-status";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AttendanceRegisterCardProps {
  userId: string;
  jsdNumber: string;
  firstName: string;
  lastName: string;
  morningStatus: string;
  afternoonStatus: string;
  isHoliday: boolean;
  isMutating: boolean;
  onStatusChange: (userId: string, session: "morning" | "afternoon", status: AttendanceStatusType) => void;
  onClear: (userId: string, session: "morning" | "afternoon") => void;
  onViewDetails: (userId: string) => void;
  onOpenLeave: (userId: string, jsd: string, first: string, last: string) => void;
}

// ponytail: admin picks status directly — no cycling nonsense
const STATUS_OPTIONS: { value: AttendanceStatusType; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "late_excused", label: "Late Exc" },
  { value: "absent_excused", label: "Absent Exc" },
];

export function AttendanceRegisterCard({
  userId,
  jsdNumber,
  firstName,
  lastName,
  morningStatus,
  afternoonStatus,
  isHoliday,
  isMutating,
  onStatusChange,
  onClear,
  onViewDetails,
  onOpenLeave,
}: AttendanceRegisterCardProps) {
  const renderStatusSelect = (session: "morning" | "afternoon", status: string) => {
    const isActive = status !== "-";
    const bgClass = isActive ? getStatusBgClass(status) : "";

    return (
      <Select
        value={isActive ? status : "__none__"}
        onValueChange={(val) => {
          if (val === "__none__") return;
          onStatusChange(userId, session, val as AttendanceStatusType);
        }}
        disabled={isMutating || isHoliday}
      >
        <SelectTrigger
          className={`h-7 min-w-[80px] px-2 py-1 text-[11px] font-register-mono uppercase tracking-[0.12em] rounded-none border-dashed
            ${isActive
              ? `border-solid ${bgClass}`
              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"
            }
            ${isHoliday ? "opacity-40 cursor-not-allowed" : ""}
          `}
        >
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">—</SelectItem>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div
      className={`
        register-card flex items-center gap-3 px-4 py-2.5
        ${isHoliday ? "opacity-70" : ""}
      `}
    >
      <span className="font-register-mono text-xs text-[hsl(var(--muted-foreground))] min-w-[90px] truncate">
        {jsdNumber}
      </span>

      <span className="font-register-body text-sm font-medium text-[hsl(var(--foreground))] flex-1 min-w-0 truncate">
        {firstName} {lastName}
      </span>

      <div className="flex items-center gap-1.5">
        {renderStatusSelect("morning", morningStatus)}
        {renderStatusSelect("afternoon", afternoonStatus)}
      </div>

      <div className="flex items-center gap-0.5 ml-1">
        <button
          onClick={() => onViewDetails(userId)}
          className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors"
          title="View details"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onOpenLeave(userId, jsdNumber, firstName, lastName)}
          className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors"
          title="Create leave request"
        >
          <CalendarClock className="h-3.5 w-3.5" />
        </button>
        {(morningStatus !== "-" || afternoonStatus !== "-") && (
          <div className="relative group">
            <button
              className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-red-600 transition-colors"
              title="Clear attendance"
            >
              <UserX className="h-3.5 w-3.5" />
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
              <div className="bg-white dark:bg-black border border-[hsl(var(--border))] shadow-lg rounded-none py-1 min-w-[120px]">
                <button
                  onClick={() => { if (morningStatus !== "-") onClear(userId, "morning"); }}
                  className="w-full text-left px-3 py-1.5 text-xs font-register-body hover:bg-[hsl(var(--secondary))] transition-colors"
                >
                  Clear AM
                </button>
                <button
                  onClick={() => { if (afternoonStatus !== "-") onClear(userId, "afternoon"); }}
                  className="w-full text-left px-3 py-1.5 text-xs font-register-body hover:bg-[hsl(var(--secondary))] transition-colors"
                >
                  Clear PM
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
