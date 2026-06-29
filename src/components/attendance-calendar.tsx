"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface AttendanceRecord {
  date: string;
  session: "morning" | "afternoon";
  status: string;
}

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  currentMonth: string;
  onMonthChange: (month: string) => void;
  onDayClick: (date: string) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_COLORS: Record<string, string> = {
  present: "bg-[hsl(var(--register-stamp-present))] text-white",
  late: "bg-[hsl(var(--register-stamp-late))] text-white",
  absent: "bg-[hsl(var(--register-stamp-absent))] text-white",
  late_excused: "bg-[hsl(var(--register-stamp-excused))] text-white",
  absent_excused: "bg-[hsl(var(--register-stamp-excused))] text-white",
  no_class: "bg-[hsl(var(--register-stamp-holiday))] text-white",
  holiday: "bg-[hsl(var(--register-stamp-holiday))] text-white",
  dropout: "bg-[hsl(var(--register-stamp-absent))] text-white",
  dismissed: "bg-[hsl(var(--register-stamp-absent))] text-white",
};

function getDayColor(morning?: string, afternoon?: string): string {
  if (!morning && !afternoon) return "bg-muted/30";

  const hasExcused =
    morning === "late_excused" || morning === "absent_excused" ||
    afternoon === "late_excused" || afternoon === "absent_excused";
  if (hasExcused) return STATUS_COLORS.excused;

  const isAbsent = (s?: string) => s === "absent";
  const isPresent = (s?: string) => s === "present" || s === "late";

  if (isAbsent(morning) && isAbsent(afternoon)) return STATUS_COLORS.absent;
  if (isAbsent(morning) || isAbsent(afternoon)) return STATUS_COLORS.late;
  if (isPresent(morning) && isPresent(afternoon)) return STATUS_COLORS.present;

  if (morning === "no_class" || afternoon === "no_class") return STATUS_COLORS.no_class;
  if (morning === "holiday" || afternoon === "holiday") return STATUS_COLORS.holiday;
  if (morning === "dropout" || afternoon === "dropout") return STATUS_COLORS.dropout;
  if (morning === "dismissed" || afternoon === "dismissed") return STATUS_COLORS.dismissed;

  return "bg-muted";
}

function getDaySymbol(morning?: string, afternoon?: string): string {
  if (!morning && !afternoon) return "?";
  if (!morning || !afternoon) return "½";
  return "✓";
}

function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function isToday(year: number, month: number, date: number): boolean {
  const today = new Date();
  return today.getFullYear() === year &&
    today.getMonth() === month - 1 &&
    today.getDate() === date;
}

export function AttendanceCalendar({ records, currentMonth, onMonthChange, onDayClick }: AttendanceCalendarProps) {
  const [year, month] = currentMonth.split("-").map(Number);

  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();

  const monthName = new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const getRecordsForDate = (date: number) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
    const morning = records.find((r) => r.date === dateStr && r.session === "morning");
    const afternoon = records.find((r) => r.date === dateStr && r.session === "afternoon");
    return {
      morning: morning?.status,
      afternoon: afternoon?.status,
    };
  };

  const calendarDays: React.ReactElement[] = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-12" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = (startDayOfWeek + day - 1) % 7;
    const { morning, afternoon } = getRecordsForDate(day);
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const colorClass = getDayColor(morning, afternoon);

    calendarDays.push(
      <button
        key={day}
        onClick={() => onDayClick(dateStr)}
        className={`h-12 rounded flex flex-col items-center justify-center text-sm font-medium
          transition-colors cursor-pointer border border-register-border/30
          ${isWeekend(dayOfWeek) ? "opacity-40" : ""}
          ${isToday(year, month, day) ? "ring-2 ring-[hsl(var(--register-stamp-present))] ring-offset-1 ring-offset-background" : ""}
          ${colorClass}
          hover:brightness-110`}
        title={`${dateStr}\nAM: ${morning || "Not marked"}\nPM: ${afternoon || "Not marked"}`}
      >
        <span className="font-register-mono text-xs leading-none">{day}</span>
        <span className="font-register-mono text-[10px] leading-none mt-px">{getDaySymbol(morning, afternoon)}</span>
      </button>
    );
  }

  return (
    <div className="register-card space-y-4 p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            const newDate = new Date(year, month - 2, 1);
            onMonthChange(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`);
          }}
          className="h-8 w-8 inline-flex items-center justify-center rounded border border-register-border/40 hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="font-register-heading text-lg">{monthName}</h3>
        <button
          onClick={() => {
            const newDate = new Date(year, month, 1);
            onMonthChange(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`);
          }}
          className="h-8 w-8 inline-flex items-center justify-center rounded border border-register-border/40 hover:bg-accent transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((day) => (
          <div key={day} className="h-8 flex items-center justify-center font-register-mono text-xs text-muted-foreground tracking-wider uppercase">
            {day}
          </div>
        ))}
        {calendarDays}
      </div>

      <div className="flex flex-wrap gap-3 text-xs border-t border-register-border/20 pt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[hsl(var(--register-stamp-present))]" />
          <span className="font-register-body">Both Present</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[hsl(var(--register-stamp-late))]" />
          <span className="font-register-body">Partial (1 absent)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[hsl(var(--register-stamp-absent))]" />
          <span className="font-register-body">Both Absent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[hsl(var(--register-stamp-excused))]" />
          <span className="font-register-body">Excused</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[hsl(var(--register-stamp-holiday))]" />
          <span className="font-register-body">Holiday</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-muted/30 border border-register-border/30" />
          <span className="font-register-body">Not Marked</span>
        </div>
      </div>
    </div>
  );
}
