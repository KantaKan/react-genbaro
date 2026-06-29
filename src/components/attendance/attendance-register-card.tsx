import { useState, useCallback } from "react";
import { Eye, CalendarClock, UserX, UserMinus } from "lucide-react";
import type { AttendanceStatusType } from "@/domain/types";
import { getStatusLabel, getStatusColor, cycleStatus } from "@/lib/attendance-status";

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
  const [stampSession, setStampSession] = useState<"morning" | "afternoon" | null>(null);

  const handleCycleStatus = useCallback(
    (session: "morning" | "afternoon", currentStatus: string) => {
      if (isMutating || isHoliday) return;
      const next = cycleStatus(currentStatus as AttendanceStatusType);
      setStampSession(session);
      onStatusChange(userId, session, next);
      setTimeout(() => setStampSession(null), 500);
    },
    [userId, isMutating, isHoliday, onStatusChange]
  );

  const renderStatusStamp = (session: "morning" | "afternoon", status: string) => {
    const isStamping = stampSession === session;
    const color = getStatusColor(status);

    return (
      <button
        onClick={() => handleCycleStatus(session, status)}
        disabled={isMutating || isHoliday}
        className={`
          relative flex items-center justify-center gap-1.5
          px-2.5 py-1.5 min-w-[80px]
          font-register-mono text-[11px] uppercase tracking-[0.12em]
          border transition-all duration-200
          ${isStamping ? "animate-stamp" : ""}
          ${status === "-"
            ? "border-dashed border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
            : `border-[${color}]/30 text-[${color}] ${getStatusBgClass(status)}`
          }
          ${isHoliday ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
          disabled:opacity-40 disabled:cursor-not-allowed
          ${isMutating ? "animate-register-loading" : ""}
        `}
        title={`${isHoliday ? "Holiday — click disabled" : `Click to cycle status (currently: ${getStatusLabel(status)})`}`}
      >
        <span className="font-bold">{status === "-" ? "—" : getStatusLabel(status)}</span>
      </button>
    );
  };

  const getStatusBgClass = (status: string) => {
    switch (status) {
      case "present": return "bg-[hsl(var(--register-stamp-present) / 0.08)]";
      case "late": return "bg-[hsl(var(--register-stamp-late) / 0.08)]";
      case "absent": return "bg-[hsl(var(--register-stamp-absent) / 0.08)]";
      case "late_excused": case "absent_excused": return "bg-[hsl(var(--register-stamp-excused) / 0.08)]";
      case "no_class": return "bg-[hsl(var(--register-stamp-no-class) / 0.08)]";
      default: return "";
    }
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
        {renderStatusStamp("morning", morningStatus)}
        {renderStatusStamp("afternoon", afternoonStatus)}
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
