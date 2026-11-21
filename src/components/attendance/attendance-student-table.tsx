import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface StudentStat {
  user_id: string;
  jsd_number: string;
  first_name: string;
  last_name: string;
  present: number;
  late: number;
  absent: number;
  absent_days: number;
  late_excused: number;
  absent_excused: number;
  warning_level: string;
}

interface AttendanceStudentTableProps {
  cohort: string;
  stats: StudentStat[];
}

type SortKey = "absent_days_desc" | "absent_desc" | "present_desc" | "name_asc" | "name_desc" | "warning_asc" | "jsd_asc" | "jsd_desc" | "absent_days_asc" | "absent_asc" | "present_asc";

const jsdNum = (jsd?: string) => {
  if (!jsd) return 9999;
  const match = jsd.match(/GEN\d+_(\d+)/i);
  return match ? parseInt(match[1], 10) : 9999;
};

const warningOrder: Record<string, number> = { red: 0, yellow: 1, normal: 2 };

function getSortedStats(data: StudentStat[], sortOption: SortKey) {
  const sorted = [...data];
  switch (sortOption) {
    case "absent_days_desc": return sorted.sort((a, b) => b.absent_days - a.absent_days);
    case "absent_days_asc": return sorted.sort((a, b) => a.absent_days - b.absent_days);
    case "absent_desc": return sorted.sort((a, b) => b.absent - a.absent);
    case "absent_asc": return sorted.sort((a, b) => a.absent - b.absent);
    case "present_desc": return sorted.sort((a, b) => b.present - a.present);
    case "present_asc": return sorted.sort((a, b) => a.present - b.present);
    case "name_asc": return sorted.sort((a, b) => a.first_name.localeCompare(b.first_name));
    case "name_desc": return sorted.sort((a, b) => b.first_name.localeCompare(a.first_name));
    case "warning_asc": return sorted.sort((a, b) => warningOrder[a.warning_level] - warningOrder[b.warning_level]);
    case "jsd_asc": return sorted.sort((a, b) => jsdNum(a.jsd_number) - jsdNum(b.jsd_number));
    case "jsd_desc": return sorted.sort((a, b) => jsdNum(b.jsd_number) - jsdNum(a.jsd_number));
    default: return sorted.sort((a, b) => b.absent_days - a.absent_days);
  }
}

function WarningStamp({ level }: { level: string }) {
  if (level === "red") {
    return <span className="font-register-mono text-[10px] uppercase bg-[hsl(var(--register-stamp-absent))]/10 text-[hsl(var(--register-stamp-absent))] px-1.5 py-0.5">Critical</span>;
  }
  if (level === "yellow") {
    return <span className="font-register-mono text-[10px] uppercase bg-[hsl(var(--register-stamp-late))]/10 text-[hsl(var(--register-stamp-late))] px-1.5 py-0.5">Warning</span>;
  }
  return <span className="font-register-mono text-[10px] uppercase text-[hsl(var(--register-stamp-present))]">Good</span>;
}

export function AttendanceStudentTable({ cohort, stats }: AttendanceStudentTableProps) {
  const navigate = useNavigate();
  const [sortOption, setSortOption] = useState<SortKey>("absent_days_desc");

  const sortedStats = useMemo(() => getSortedStats(stats, sortOption), [stats, sortOption]);

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2 bg-[hsl(var(--primary))]/10 border border-[hsl(var(--border))]">
        <span className="font-register-heading text-xs uppercase tracking-[0.15em] text-[hsl(var(--foreground))]">
          Student Ledger — Cohort {cohort}
        </span>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortKey)}
          className="h-7 text-xs rounded-none border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 font-register-mono text-[hsl(var(--foreground))]"
        >
          <option value="absent_days_desc">Most Absent Days</option>
          <option value="absent_desc">Most Absent Sessions</option>
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
        <span className="w-10 text-center">P</span>
        <span className="w-10 text-center">L</span>
        <span className="w-12 text-center">A Sess</span>
        <span className="w-10 text-center">Days</span>
        <span className="w-12 text-center">Exc</span>
        <span className="w-14 text-center">Status</span>
        <span className="w-12 text-center" />
      </div>

      <div className="border-x border-b border-[hsl(var(--border))]">
        {sortedStats.length === 0 ? (
          <div className="text-center py-12 font-register-body text-sm text-[hsl(var(--muted-foreground))]">
            No attendance data available
          </div>
        ) : (
          sortedStats.map((student) => (
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
              <span className="w-10 text-center font-register-mono text-sm text-[hsl(var(--register-stamp-present))]">{student.present}</span>
              <span className="w-10 text-center font-register-mono text-sm text-[hsl(var(--register-stamp-late))]">{student.late}</span>
              <span className="w-12 text-center font-register-mono text-sm text-[hsl(var(--register-stamp-absent))]">{student.absent}</span>
              <span className="w-10 text-center font-register-mono text-sm font-bold text-[hsl(var(--register-stamp-absent))]">{student.absent_days}</span>
              <span className="w-12 text-center font-register-mono text-sm text-[hsl(var(--register-stamp-excused))]">{student.late_excused + student.absent_excused}</span>
              <span className="w-14 text-center">
                <WarningStamp level={student.warning_level} />
              </span>
              <button
                onClick={() => navigate(`/admin/attendance/student/${student.user_id}`)}
                className="w-12 text-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors font-register-mono text-xs"
              >
                View
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
