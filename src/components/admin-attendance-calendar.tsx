"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { getDailyAttendanceStats, getHolidays, type DailyStats, type Holiday } from "@/lib/api";

interface AdminAttendanceCalendarProps {
  cohort: number;
  onDayClick: (date: string, isHoliday: boolean, holiday?: Holiday) => void;
  holidays?: Holiday[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AdminAttendanceCalendar({ cohort, onDayClick, holidays: externalHolidays }: AdminAttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [internalHolidays, setInternalHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const holidays = externalHolidays || internalHolidays;

  useEffect(() => {
    loadData();
  }, [cohort, currentMonth, externalHolidays]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [year, month] = currentMonth.split("-").map(Number);
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0);
      const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay.getDate()).padStart(2, "0")}`;
      const [stats] = await Promise.all([getDailyAttendanceStats(cohort, startDate, endDate)]);
      setDailyStats(stats);
      if (!externalHolidays) {
        const holidaysData = await getHolidays(startDate, endDate);
        setInternalHolidays(holidaysData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load calendar data.");
    } finally {
      setIsLoading(false);
    }
  };

  const prevMonth = () => {
    const [year, month] = currentMonth.split("-").map(Number);
    const newDate = new Date(year, month - 2, 1);
    setCurrentMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`);
  };

  const nextMonth = () => {
    const [year, month] = currentMonth.split("-").map(Number);
    const newDate = new Date(year, month, 1);
    setCurrentMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, "0")}`);
  };

  const getStatsForDate = (date: string): DailyStats | null =>
    dailyStats.find((s) => s.date === date) || null;

  const getHolidayForDate = (date: string): Holiday | null => {
    if (!holidays) return null;
    return holidays.find((h) => date >= h.start_date && date <= h.end_date) || null;
  };

  const getDayColorTokens = (rate: number, isHoliday: boolean): string => {
    if (isHoliday) return "bg-[hsl(var(--register-stamp-excused))]/20 border-[hsl(var(--register-stamp-excused))]";
    if (rate < 0) return "bg-[hsl(var(--background))] border-[hsl(var(--border))]";
    if (rate >= 90) return "bg-[hsl(var(--register-stamp-present))]/10 border-[hsl(var(--register-stamp-present))]";
    if (rate >= 70) return "bg-[hsl(var(--register-stamp-late))]/10 border-[hsl(var(--register-stamp-late))]";
    return "bg-[hsl(var(--register-stamp-absent))]/10 border-[hsl(var(--register-stamp-absent))]";
  };

  const [year, month] = currentMonth.split("-").map(Number);
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();
  const monthName = new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const th = new Date(utc + 7 * 3600000);
  const todayStr = `${th.getFullYear()}-${String(th.getMonth() + 1).padStart(2, "0")}-${String(th.getDate()).padStart(2, "0")}`;

  const calendarDays: JSX.Element[] = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = (startDayOfWeek + day - 1) % 7;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = `${currentMonth}-${String(day).padStart(2, "0")}`;
    const isToday = dateStr === todayStr;
    const stats = getStatsForDate(dateStr);
    const holiday = getHolidayForDate(dateStr);
    const isHolidayDay = !!holiday;
    const rate = (stats && typeof stats.rate === "number") ? Math.round(stats.rate)
      : !stats || stats.total === 0 ? -1
      : Math.round(((stats.present + stats.late + stats.late_excused + stats.absent_excused) / stats.total) * 100);

    const amPresent = stats?.am_present || 0;
    const pmPresent = stats?.pm_present || 0;
    const amTotal = stats?.am_total || 0;
    const pmTotal = stats?.pm_total || 0;

    calendarDays.push(
      <button
        key={day}
        onClick={() => onDayClick(dateStr, isHolidayDay, holiday || undefined)}
        disabled={isWeekend}
        className={`
          border p-1.5 flex flex-col items-center justify-center text-xs transition-colors relative
          font-register-body
          ${isWeekend ? "opacity-30 cursor-not-allowed bg-[hsl(var(--background))]" : "cursor-pointer hover:border-[hsl(var(--primary))]"}
          ${isToday ? "ring-1 ring-[hsl(var(--primary))]" : ""}
          ${!isWeekend ? getDayColorTokens(rate, isHolidayDay) : "border-[hsl(var(--border))]"}
        `}
        style={{ minHeight: "88px" }}
      >
        <span className={`font-register-mono text-xs mb-1 ${isToday ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--foreground))]"}`}>
          {day}
        </span>
        {isHolidayDay && !isWeekend && (
          <Star className="h-3 w-3 mb-0.5 fill-[hsl(var(--register-stamp-excused))] text-[hsl(var(--register-stamp-excused))]" />
        )}
        {!isWeekend && !isHolidayDay && (
          <div className="text-[9px] space-y-0.5 font-register-mono text-[hsl(var(--muted-foreground))]">
            <div>AM: {amTotal > 0 ? `${amPresent}/${amTotal}` : "-"}</div>
            <div>PM: {pmTotal > 0 ? `${pmPresent}/${pmTotal}` : "-"}</div>
          </div>
        )}
        {isHolidayDay && !isWeekend && (
          <span className="font-register-mono text-[9px] truncate max-w-full text-[hsl(var(--register-stamp-excused))]">
            {holiday?.name || "Holiday"}
          </span>
        )}
        {!isWeekend && !isHolidayDay && rate >= 0 && (
          <span className="font-register-mono text-[9px] mt-0.5 text-[hsl(var(--muted-foreground))]">{rate}%</span>
        )}
        {!isWeekend && !isHolidayDay && stats && (Number(stats.absent) + Number(stats.absent_excused)) > 0 && (
          <span className="absolute bottom-0.5 right-0.5 font-register-mono text-[8px] bg-[hsl(var(--register-stamp-absent))] text-white px-1 py-0.5">
            {Number(stats.absent) + Number(stats.absent_excused)}A
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="register-card">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[hsl(var(--border))]">
        <div>
          <p className="font-register-heading text-xs uppercase tracking-[0.15em] text-[hsl(var(--foreground))]">Monthly Overview</p>
          <p className="font-register-mono text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">Click a day to manage</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-register-mono text-xs min-w-[130px] text-center text-[hsl(var(--foreground))]">{monthName}</span>
          <button onClick={nextMonth} className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-8 font-register-body text-sm text-[hsl(var(--muted-foreground))]">Loading calendar...</div>
        ) : error ? (
          <div className="text-center py-8 font-register-body text-sm text-[hsl(var(--register-stamp-absent))]">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-px mb-1">
              {DAYS.map((day) => (
                <div key={day} className="py-1.5 flex items-center justify-center font-register-mono text-[10px] uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))]">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px">
              {calendarDays}
            </div>
            <div className="flex flex-wrap gap-4 font-register-mono text-[10px] mt-4 pt-3 border-t border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 border border-[hsl(var(--register-stamp-present))] bg-[hsl(var(--register-stamp-present))]/10" />
                <span>90%+</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 border border-[hsl(var(--register-stamp-late))] bg-[hsl(var(--register-stamp-late))]/10" />
                <span>70-89%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 border border-[hsl(var(--register-stamp-absent))] bg-[hsl(var(--register-stamp-absent))]/10" />
                <span>&lt;70%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 border border-[hsl(var(--border))] bg-[hsl(var(--background))]" />
                <span>No data</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-3 w-3 fill-[hsl(var(--register-stamp-excused))] text-[hsl(var(--register-stamp-excused))]" />
                <span>Holiday</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-register-mono text-[8px] bg-[hsl(var(--register-stamp-absent))] text-white px-1">1A</span>
                <span>Absent</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
