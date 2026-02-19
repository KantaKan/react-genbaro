"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { getDailyAttendanceStats, getHolidays, type DailyStats, type Holiday } from "@/lib/api";
import { AppErrorBanner } from "@/components/AppErrorBanner"; // Import AppErrorBanner

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

  // Use external holidays if provided, otherwise use internal state
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
      
      const [stats] = await Promise.all([
        getDailyAttendanceStats(cohort, startDate, endDate),
      ]);
      
      setDailyStats(stats);
      
      // Only fetch holidays internally if external holidays not provided
      if (!externalHolidays) {
        const holidaysData = await getHolidays(startDate, endDate);
        setInternalHolidays(holidaysData);
      }
    } catch (err: any) {
      console.error("Error loading calendar data:", err);
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

  const getStatsForDate = (date: string): DailyStats | null => {
    return dailyStats.find((s) => s.date === date) || null;
  };

  const getHolidayForDate = (date: string): Holiday | null => {
    if (!holidays) return null;
    return holidays.find((h) => {
      return date >= h.start_date && date <= h.end_date;
    }) || null;
  };

  const getAttendanceRate = (stats: DailyStats | null): number => {
    if (!stats || stats.total === 0) return -1;
    const attended = stats.present + stats.late + stats.late_excused + stats.absent_excused;
    return Math.round((attended / stats.total) * 100);
  };

  const getDayColorClass = (rate: number, isHoliday: boolean): string => {
    if (isHoliday) return "bg-purple-500 text-white hover:bg-purple-600";
    if (rate < 0) return "bg-muted/30 hover:bg-muted/50";
    if (rate >= 90) return "bg-green-500 text-white hover:bg-green-600";
    if (rate >= 70) return "bg-yellow-500 text-white hover:bg-yellow-600";
    return "bg-red-500 text-white hover:bg-red-600";
  };

  const [year, month] = currentMonth.split("-").map(Number);
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();

  const monthName = new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const calendarDays: JSX.Element[] = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-24" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = (startDayOfWeek + day - 1) % 7;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = `${currentMonth}-${String(day).padStart(2, "0")}`;
    const isToday = dateStr === todayStr;
    const stats = getStatsForDate(dateStr);
    const holiday = getHolidayForDate(dateStr);
    const isHoliday = !!holiday;
    const rate = getAttendanceRate(stats);

    const totalSessions = stats ? stats.total : 0;
    const studentsPerSession = totalSessions > 0 ? Math.ceil(totalSessions / 2) : 0;

    calendarDays.push(
      <button
        key={day}
        onClick={() => onDayClick(dateStr, isHoliday, holiday || undefined)}
        disabled={isWeekend}
        className={`
          h-24 rounded-md flex flex-col items-center justify-center text-sm font-medium
          transition-colors relative
          ${isWeekend ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
          ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}
          ${isWeekend ? "bg-muted/20" : getDayColorClass(rate, isHoliday)}
        `}
        title={holiday ? `${holiday.name}${holiday.description ? ` - ${holiday.description}` : ""}` : stats ? `Present: ${stats.present}, Late: ${stats.late}, Absent: ${stats.absent}, Excused: ${stats.late_excused + stats.absent_excused}` : "No data"}
      >
        <span className="text-xs font-bold mb-1">{day}</span>
        {isHoliday && !isWeekend && (
          <Star className="h-3 w-3 mb-0.5 fill-yellow-300 text-yellow-300" />
        )}
        {!isWeekend && !isHoliday && (
          <div className="text-[10px] space-y-0.5">
            <div>AM: {stats ? `${Math.round(rate * studentsPerSession / 100)}/${studentsPerSession}` : "-"}</div>
            <div>PM: {stats ? `${Math.round(rate * studentsPerSession / 100)}/${studentsPerSession}` : "-"}</div>
          </div>
        )}
        {isHoliday && !isWeekend && (
          <span className="text-[9px] font-semibold truncate max-w-[90%]">{holiday?.name || "Holiday"}</span>
        )}
        {!isWeekend && !isHoliday && rate >= 0 && (
          <span className="text-[9px] mt-0.5">{rate}%</span>
        )}
        {!isWeekend && !isHoliday && stats && (
          (() => {
            const absentCount = Number(stats.absent) || 0;
            const absentExcusedCount = Number(stats.absent_excused) || 0;
            const totalAbsent = absentCount + absentExcusedCount;
            if (totalAbsent > 0) {
              return (
                <span className="absolute bottom-1 right-1 text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                  {totalAbsent} A
                </span>
              );
            }
            return null;
          })()
        )}
      </button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Monthly Overview</CardTitle>
            <CardDescription>Click on a day to see details or mark as holiday</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">{monthName}</span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading calendar...</div>
        ) : error ? ( // Display error if present
          <div className="p-4">
            <AppErrorBanner error={error} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays}
            </div>
            <div className="flex flex-wrap gap-4 text-xs mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span>Excellent (90%+)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500" />
                <span>Warning (70-89%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span>Critical (&lt;70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted/30" />
                <span>Not marked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-500 flex items-center justify-center">
                  <Star className="h-2 w-2 fill-yellow-300 text-yellow-300" />
                </div>
                <span>Holiday/Break</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-red-600 text-white rounded-full font-bold text-[9px]">A</span>
                <span>Absent count</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
