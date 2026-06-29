"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAttendanceContext } from "./attendance-shell";
import { useAttendanceStats } from "@/application/hooks/useAttendance";

const getDefaultStartDate = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const th = new Date(utc + 7 * 3600000);
  th.setDate(th.getDate() - 30);
  return `${th.getFullYear()}-${String(th.getMonth() + 1).padStart(2, "0")}-${String(th.getDate()).padStart(2, "0")}`;
};

const getThailandDate = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const th = new Date(utc + 7 * 3600000);
  const year = th.getFullYear();
  const month = String(th.getMonth() + 1).padStart(2, "0");
  const day = String(th.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function WarningStamp({ level }: { level: string }) {
  if (level === "red") {
    return <span className="font-register-mono text-[10px] uppercase bg-[hsl(var(--register-stamp-absent))]/10 text-[hsl(var(--register-stamp-absent))] px-1.5 py-0.5">Critical</span>;
  }
  if (level === "yellow") {
    return <span className="font-register-mono text-[10px] uppercase bg-[hsl(var(--register-stamp-late))]/10 text-[hsl(var(--register-stamp-late))] px-1.5 py-0.5">Warning</span>;
  }
  return <span className="font-register-mono text-[10px] uppercase text-[hsl(var(--register-stamp-present))]">Good</span>;
}

export function AttendanceAllStudentsView() {
  const { selectedCohort, onViewDetails } = useAttendanceContext();
  const cohortNum = parseInt(selectedCohort);
  const statsQuery = useAttendanceStats(cohortNum, getDefaultStartDate(), getThailandDate());

  const [sortOption, setSortOption] = useState<string>("absent_days_desc");
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 25;

  const stats = statsQuery.data;

  const jsdNum = (jsd?: string) => {
    if (!jsd) return 9999;
    const match = jsd.match(/GEN\d+_(\d+)/i);
    return match ? parseInt(match[1], 10) : 9999;
  };

  const sortedStats = useMemo(() => {
    const data = [...(stats ?? [])];
    switch (sortOption) {
      case "absent_days_desc": return data.sort((a: any, b: any) => b.absent_days - a.absent_days);
      case "absent_days_asc": return data.sort((a: any, b: any) => a.absent_days - b.absent_days);
      case "absent_desc": return data.sort((a: any, b: any) => b.absent - a.absent);
      case "present_desc": return data.sort((a: any, b: any) => b.present - a.present);
      case "name_asc": return data.sort((a: any, b: any) => a.first_name.localeCompare(b.first_name));
      case "name_desc": return data.sort((a: any, b: any) => b.first_name.localeCompare(a.first_name));
      case "warning_asc": return data.sort((a: any, b: any) => (b.warning_level === "red" ? 0 : 1) - (a.warning_level === "red" ? 0 : 1));
      case "jsd_asc": return data.sort((a: any, b: any) => jsdNum(a.jsd_number) - jsdNum(b.jsd_number));
      default: return data.sort((a: any, b: any) => b.absent_days - a.absent_days);
    }
  }, [stats, sortOption]);

  const totalPages = Math.max(1, Math.ceil(sortedStats.length / PAGE_SIZE));
  const pageStats = sortedStats.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  if (statsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-[hsl(var(--muted-foreground))] font-register-body text-sm">
          Loading stats...
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 bg-[hsl(var(--primary))]/10 border border-[hsl(var(--border))]">
        <span className="font-register-heading text-xs uppercase tracking-[0.15em] text-[hsl(var(--foreground))]">
          Student Ledger — Cohort {selectedCohort}
        </span>
        <select
          value={sortOption}
          onChange={(e) => { setSortOption(e.target.value); setCurrentPage(0); }}
          className="h-7 text-xs rounded-none border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 font-register-mono text-[hsl(var(--foreground))]"
        >
          <option value="absent_days_desc">Most Absent Days</option>
          <option value="absent_desc">Most Absent Sess</option>
          <option value="present_desc">Most Present</option>
          <option value="name_asc">Name A-Z</option>
          <option value="name_desc">Name Z-A</option>
          <option value="warning_asc">Warnings First</option>
          <option value="jsd_asc">JSD Number</option>
        </select>
      </div>

      <div className="flex items-center gap-3 px-4 py-1.5 border-x border-[hsl(var(--border))] bg-[hsl(var(--secondary))] font-register-mono text-[10px] uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))]">
        <span className="min-w-[90px]">JSD</span>
        <span className="flex-1">Name</span>
        <span className="w-12 text-center">P</span>
        <span className="w-12 text-center">L</span>
        <span className="w-12 text-center">A</span>
        <span className="w-12 text-center">Days</span>
        <span className="w-14 text-center">Exc</span>
        <span className="w-16 text-center">Status</span>
        <span className="w-10 text-center" />
      </div>

      <div className="border-x border-b border-[hsl(var(--border))]">
        {pageStats.length === 0 ? (
          <div className="text-center py-12 font-register-body text-sm text-[hsl(var(--muted-foreground))]">
            No data available
          </div>
        ) : (
          pageStats.map((student: any) => (
            <div
              key={student.user_id}
              className="flex items-center gap-3 px-4 py-2 border-b border-[hsl(var(--border))]/50 last:border-b-0 hover:bg-[hsl(var(--primary))]/[0.02] transition-colors"
            >
              <span className="font-register-mono text-xs text-[hsl(var(--muted-foreground))] min-w-[90px] truncate">
                {student.jsd_number}
              </span>
              <span className="font-register-body text-sm text-[hsl(var(--foreground))] flex-1 min-w-0 truncate">
                {student.first_name} {student.last_name}
              </span>
              <span className="w-12 text-center font-register-mono text-sm text-[hsl(var(--register-stamp-present))]">{student.present}</span>
              <span className="w-12 text-center font-register-mono text-sm text-[hsl(var(--register-stamp-late))]">{student.late}</span>
              <span className="w-12 text-center font-register-mono text-sm text-[hsl(var(--register-stamp-absent))]">{student.absent}</span>
              <span className="w-12 text-center font-register-mono text-sm font-bold text-[hsl(var(--register-stamp-absent))]">{student.absent_days}</span>
              <span className="w-14 text-center font-register-mono text-sm text-[hsl(var(--register-stamp-excused))]">{student.late_excused + student.absent_excused}</span>
              <span className="w-16 text-center">
                <WarningStamp level={student.warning_level} />
              </span>
              <button
                onClick={() => onViewDetails(student.user_id)}
                className="w-10 text-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors font-register-mono text-xs"
              >
                View
              </button>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 bg-[hsl(var(--primary))]/5 border border-[hsl(var(--border))] border-t-0">
          <span className="font-register-mono text-[10px] text-[hsl(var(--muted-foreground))]">
            {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, sortedStats.length)} of {sortedStats.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] disabled:opacity-30"
            >
              &#8592;
            </button>
            <span className="font-register-mono text-xs">{currentPage + 1}/{totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] disabled:opacity-30"
            >
              &#8594;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
