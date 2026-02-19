"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getDailyAttendanceStats, type DailyStats } from "@/lib/api";

interface AdminAttendanceCalendarProps {
  cohort: number;
  onDayClick: (date: string) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AdminAttendanceCalendar({ cohort, onDayClick }: AdminAttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [cohort, currentMonth]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const [year, month] = currentMonth.split("-").map(Number);
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const today = new Date();
      
      const daysDiff = Math.ceil((today.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)) + 31;
      
      const stats = await getDailyAttendanceStats(cohort, Math.min(daysDiff, 365));
      
      const monthStats = stats.filter((s) => {
        const statDate = new Date(s.date);
        return statDate.getFullYear() === year && statDate.getMonth() === month - 1;
      });
      
      setDailyStats(monthStats);
    } catch (error) {
      console.error("Error loading daily stats:", error);
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

  const getStatsForDate = (date: number): DailyStats | null => {
    const dateStr = `${currentMonth}-${String(date).padStart(2, "0")}`;
    return dailyStats.find((s) => s.date === dateStr) || null;
  };

  const getAttendanceRate = (stats: DailyStats | null): number => {
    if (!stats || stats.total === 0) return -1;
    const attended = stats.present + stats.late + stats.late_excused + stats.absent_excused;
    return Math.round((attended / stats.total) * 100);
  };

  const getDayColorClass = (rate: number): string => {
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
    calendarDays.push(<div key={`empty-${i}`} className="h-20" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeek = (startDayOfWeek + day - 1) % 7;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = `${currentMonth}-${String(day).padStart(2, "0")}`;
    const isToday = dateStr === todayStr;
    const stats = getStatsForDate(day);
    const rate = getAttendanceRate(stats);

    const morningCount = stats ? stats.present + stats.late + stats.late_excused + stats.absent_excused : 0;
    const afternoonCount = stats ? stats.present + stats.late + stats.late_excused + stats.absent_excused : 0;
    const totalSessions = stats ? stats.total : 0;
    const studentsPerSession = totalSessions > 0 ? Math.ceil(totalSessions / 2) : 0;

    calendarDays.push(
      <button
        key={day}
        onClick={() => !isWeekend && onDayClick(dateStr)}
        disabled={isWeekend}
        className={`
          h-24 rounded-md flex flex-col items-center justify-center text-sm font-medium
          transition-colors relative
          ${isWeekend ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
          ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}
          ${isWeekend ? "bg-muted/20" : getDayColorClass(rate)}
        `}
        title={stats ? `Present: ${stats.present}, Late: ${stats.late}, Absent: ${stats.absent}, Excused: ${stats.late_excused + stats.absent_excused}` : "No data"}
      >
        <span className="text-xs font-bold mb-1">{day}</span>
        {!isWeekend && (
          <div className="text-[10px] space-y-0.5">
            <div>AM: {stats ? `${Math.round(rate * studentsPerSession / 100)}/${studentsPerSession}` : "-"}</div>
            <div>PM: {stats ? `${Math.round(rate * studentsPerSession / 100)}/${studentsPerSession}` : "-"}</div>
          </div>
        )}
        {!isWeekend && rate >= 0 && (
          <span className="text-[9px] mt-0.5">{rate}%</span>
        )}
        {!isWeekend && stats && (
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
            <CardDescription>Click on a day to see details</CardDescription>
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
