"use client";

import { Button } from "@/components/ui/button";
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

export function AttendanceCalendar({ records, currentMonth, onMonthChange, onDayClick }: AttendanceCalendarProps) {
  const [year, month] = currentMonth.split("-").map(Number);
  
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();

  const prevMonth = () => {
    const newDate = new Date(year, month - 2, 1);
    onMonthChange(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`);
  };

  const nextMonth = () => {
    const newDate = new Date(year, month, 1);
    onMonthChange(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`);
  };

  const getRecordsForDate = (date: number): { morning?: string; afternoon?: string } => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
    const morning = records.find((r) => r.date === dateStr && r.session === "morning");
    const afternoon = records.find((r) => r.date === dateStr && r.session === "afternoon");
    return {
      morning: morning?.status,
      afternoon: afternoon?.status,
    };
  };

  const getDayColor = (morning?: string, afternoon?: string): string => {
    if (!morning && !afternoon) return "bg-muted/30";
    
    const hasExcused = morning === "late_excused" || morning === "absent_excused" ||
                       afternoon === "late_excused" || afternoon === "absent_excused";
    
    if (hasExcused) return "bg-blue-500 text-white";
    
    const isAbsent = (s?: string) => s === "absent";
    const isPresent = (s?: string) => s === "present" || s === "late";
    
    if (isAbsent(morning) && isAbsent(afternoon)) return "bg-red-500 text-white";
    if (isAbsent(morning) || isAbsent(afternoon)) return "bg-yellow-500 text-white";
    if (isPresent(morning) && isPresent(afternoon)) return "bg-green-500 text-white";
    
    return "bg-muted";
  };

  const getDaySymbol = (morning?: string, afternoon?: string): string => {
    if (!morning && !afternoon) return "?";
    if (!morning || !afternoon) return "½";
    return "✓";
  };

  const isWeekend = (dayOfWeek: number): boolean => {
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const isToday = (date: number): boolean => {
    const today = new Date();
    return today.getFullYear() === year && 
           today.getMonth() === month - 1 && 
           today.getDate() === date;
  };

  const monthName = new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const calendarDays: JSX.Element[] = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-12" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = (startDayOfWeek + day - 1) % 7;
    const { morning, afternoon } = getRecordsForDate(day);
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    calendarDays.push(
      <button
        key={day}
        onClick={() => onDayClick(dateStr)}
        className={`
          h-12 rounded-md flex flex-col items-center justify-center text-sm font-medium
          transition-colors cursor-pointer
          ${isWeekend(dayOfWeek) ? "opacity-50" : ""}
          ${isToday(day) ? "ring-2 ring-primary ring-offset-1" : ""}
          ${getDayColor(morning, afternoon)}
          hover:opacity-80
        `}
        title={`${dateStr}\nAM: ${morning || "Not marked"}\nPM: ${afternoon || "Not marked"}`}
      >
        <span className="text-xs">{day}</span>
        <span className="text-[10px]">{getDaySymbol(morning, afternoon)}</span>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">{monthName}</h3>
        <Button variant="outline" size="sm" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((day) => (
          <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {calendarDays}
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span>Both Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500" />
          <span>Partial (1 absent)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span>Both Absent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span>Excused</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted/30" />
          <span>Not Marked</span>
        </div>
      </div>
    </div>
  );
}
