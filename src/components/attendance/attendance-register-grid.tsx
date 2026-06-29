import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttendanceRegisterCard } from "./attendance-register-card";
import type { AttendanceStatusType, TodayStudent } from "@/domain/types";

const PAGE_SIZE = 20;

interface AttendanceRegisterGridProps {
  students: TodayStudent[];
  date: string;
  isHoliday: boolean;
  isLoading: boolean;
  isMutating: boolean;
  holidayName?: string;
  onMarkAllPresent: () => void;
  onStatusChange: (userId: string, session: "morning" | "afternoon", status: AttendanceStatusType) => void;
  onClear: (userId: string, session: "morning" | "afternoon") => void;
  onViewDetails: (userId: string) => void;
  onOpenLeave: (userId: string, jsd: string, first: string, last: string) => void;
}

export function AttendanceRegisterGrid({
  students,
  date,
  isHoliday,
  isLoading,
  isMutating,
  holidayName,
  onMarkAllPresent,
  onStatusChange,
  onClear,
  onViewDetails,
  onOpenLeave,
}: AttendanceRegisterGridProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(students.length / PAGE_SIZE));

  const sortedStudents = useMemo(() => {
    const jsdNum = (jsd?: string) => {
      if (!jsd) return 9999;
      const match = jsd.match(/GEN\d+_(\d+)/i);
      return match ? parseInt(match[1], 10) : 9999;
    };
    return [...students].sort((a, b) => jsdNum(a.jsd_number) - jsdNum(b.jsd_number));
  }, [students]);

  const pageStudents = sortedStudents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const marginals = useMemo(() => {
    const morningMarked = students.filter((s) => s.morning !== "-").length;
    const afternoonMarked = students.filter((s) => s.afternoon !== "-").length;
    const total = students.length;
    return { morningMarked, afternoonMarked, total };
  }, [students]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--primary))]" />
        <span className="ml-3 font-register-body text-sm text-[hsl(var(--muted-foreground))]">
          Loading register...
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* Register header — the brass ledger bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[hsl(var(--primary))]/10 border border-[hsl(var(--border))] mb-0">
        <div className="flex items-center gap-4">
          <span className="font-register-heading text-sm uppercase tracking-[0.15em] text-[hsl(var(--foreground))]">
            Register — {date}
          </span>
          {isHoliday && (
            <span className="font-register-mono text-[10px] uppercase bg-[hsl(var(--register-stamp-no-class))]/10 text-[hsl(var(--register-stamp-no-class))] px-2 py-0.5">
              {holidayName || "Holiday"}
            </span>
          )}
          <span className="font-register-mono text-[10px] text-[hsl(var(--muted-foreground))]">
            AM {marginals.morningMarked}/{marginals.total} &middot; PM {marginals.afternoonMarked}/{marginals.total}
          </span>
        </div>

        <Button
          onClick={onMarkAllPresent}
          size="sm"
          disabled={isHoliday || isMutating}
          className="rounded-none h-7 px-3 text-xs font-register-body uppercase tracking-[0.1em] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary-foreground))] disabled:opacity-30"
        >
          {isMutating ? (
            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
          ) : (
            <Users className="h-3 w-3 mr-1.5" />
          )}
          Punch All Present
        </Button>
      </div>

      {/* Grid body */}
      <div className="border-x border-b border-[hsl(var(--border))]">
        {pageStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[hsl(var(--muted-foreground))]">
            <span className="font-register-heading text-lg mb-1">No Entries</span>
            <span className="font-register-body text-xs">No students found for this cohort.</span>
          </div>
        ) : (
          <div>
            {pageStudents.map((student) => (
              <AttendanceRegisterCard
                key={student.user_id}
                userId={student.user_id}
                jsdNumber={student.jsd_number}
                firstName={student.first_name}
                lastName={student.last_name}
                morningStatus={student.morning}
                afternoonStatus={student.afternoon}
                isHoliday={isHoliday}
                isMutating={isMutating}
                onStatusChange={onStatusChange}
                onClear={onClear}
                onViewDetails={onViewDetails}
                onOpenLeave={onOpenLeave}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination — brass bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 bg-[hsl(var(--primary))]/5 border border-[hsl(var(--border))] border-t-0">
          <span className="font-register-mono text-[10px] text-[hsl(var(--muted-foreground))]">
            Showing {(page * PAGE_SIZE) + 1}–{Math.min((page + 1) * PAGE_SIZE, students.length)} of {students.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="font-register-mono text-xs text-[hsl(var(--foreground))]">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
