"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getTodayOverview, type TodayOverview, type Holiday } from "@/lib/api";
import { Sun, Sunset, Users, Calendar, Loader2, Star, Trash2 } from "lucide-react";

interface DaySummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  cohort: number;
  onMarkAttendance: () => void;
  holiday?: Holiday | null;
  onMarkAsHoliday?: (date: string) => void;
  onRemoveHoliday?: (holidayId: string) => void;
}

function StatCard({ count, label, stamp }: { count: number; label: string; stamp: string }) {
  const colors: Record<string, string> = {
    present: "bg-[hsl(var(--register-stamp-present)_/_0.1)] text-[hsl(var(--register-stamp-present))] border-[hsl(var(--register-stamp-present)_/_0.2)]",
    late: "bg-[hsl(var(--register-stamp-late)_/_0.1)] text-[hsl(var(--register-stamp-late))] border-[hsl(var(--register-stamp-late)_/_0.2)]",
    absent: "bg-[hsl(var(--register-stamp-absent)_/_0.1)] text-[hsl(var(--register-stamp-absent))] border-[hsl(var(--register-stamp-absent)_/_0.2)]",
    excused: "bg-[hsl(var(--register-stamp-excused)_/_0.1)] text-[hsl(var(--register-stamp-excused))] border-[hsl(var(--register-stamp-excused)_/_0.2)]",
    holiday: "bg-[hsl(var(--register-stamp-holiday)_/_0.1)] text-[hsl(var(--register-stamp-holiday))] border-[hsl(var(--register-stamp-holiday)_/_0.2)]",
  };
  const colorClass = colors[stamp] || "bg-muted text-muted-foreground border-muted";

  return (
    <div className={`p-2 rounded border text-center ${colorClass}`}>
      <p className="font-register-mono text-lg font-bold">{count}</p>
      <p className="font-register-body text-xs">{label}</p>
    </div>
  );
}

function HolidayStamp({ name, description, startDate, endDate }: { name: string; description?: string; startDate?: string; endDate?: string }) {
  return (
    <div className="text-center p-6 rounded border border-[hsl(var(--register-stamp-holiday)_/_0.3)] bg-[hsl(var(--register-stamp-holiday)_/_0.08)]">
      <Star className="h-10 w-10 mx-auto mb-3 text-[hsl(var(--register-stamp-holiday))]" />
      <h3 className="font-register-heading text-lg text-[hsl(var(--register-stamp-holiday))]">{name}</h3>
      {description && (
        <p className="font-register-body text-sm text-muted-foreground mt-2">{description}</p>
      )}
      {startDate !== endDate && startDate && endDate && (
        <p className="font-register-mono text-xs text-muted-foreground mt-2">{startDate} to {endDate}</p>
      )}
    </div>
  );
}

function getSessionStats(students: TodayOverview["students"], session: "morning" | "afternoon") {
  const present = students.filter((s) => s[session] === "present").length;
  const late = students.filter((s) => s[session] === "late").length;
  const absent = students.filter((s) => s[session] === "absent").length;
  const lateExcused = students.filter((s) => s[session] === "late_excused").length;
  const absentExcused = students.filter((s) => s[session] === "absent_excused").length;
  const noClass = students.filter((s) => s[session] === "no_class").length;
  const holiday = students.filter((s) => s[session] === "holiday").length;
  const dropout = students.filter((s) => s[session] === "dropout").length;
  const dismissed = students.filter((s) => s[session] === "dismissed").length;
  const total = students.length;
  const attended = present + late + lateExcused + absentExcused;
  const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
  const absentStudents = students.filter((s) => s[session] === "absent");
  return { present, late, absent, lateExcused, absentExcused, noClass, holiday, dropout, dismissed, total, attended, rate, absentStudents };
}

function AttendanceRateBadge({ rate }: { rate: number }) {
  const color = rate >= 90 ? "var(--register-stamp-present)" : rate >= 70 ? "var(--register-stamp-late)" : "var(--register-stamp-absent)";
  return (
    <span
      className="font-register-mono text-xs px-2 py-0.5 rounded border"
      style={{ color: `hsl(${color})`, borderColor: `hsl(${color} / 0.3)`, backgroundColor: `hsl(${color} / 0.08)` }}
    >
      {rate}%
    </span>
  );
}

export function DaySummaryDialog({
  open,
  onOpenChange,
  date,
  cohort,
  onMarkAttendance,
  holiday,
  onMarkAsHoliday,
  onRemoveHoliday,
}: DaySummaryDialogProps) {
  const [overview, setOverview] = useState<TodayOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isHoliday = !!holiday;

  useEffect(() => {
    if (open && date && cohort) {
      loadOverview();
    }
  }, [open, date, cohort]);

  const loadOverview = async () => {
    setIsLoading(true);
    try {
      const data = await getTodayOverview(cohort, undefined, date);
      setOverview(data);
    } catch (error) {
      console.error("Error loading day overview:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const morningStats = overview ? getSessionStats(overview.students, "morning") : null;
  const afternoonStats = overview ? getSessionStats(overview.students, "afternoon") : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-register-heading">
            <Calendar className="h-5 w-5" />
            {formatDate(date)}
            {isHoliday && (
              <span className="font-register-mono text-xs px-2 py-0.5 rounded border border-[hsl(var(--register-stamp-holiday)_/_0.3)] bg-[hsl(var(--register-stamp-holiday)_/_0.1)] text-[hsl(var(--register-stamp-holiday))] flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                Holiday
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="font-register-mono text-xs">
            Cohort {cohort}
            {isHoliday && holiday && ` • ${holiday.name}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isHoliday ? (
          <div className="space-y-4 py-4">
            <HolidayStamp
              name={holiday?.name || "Holiday"}
              description={holiday?.description}
              startDate={holiday?.start_date}
              endDate={holiday?.end_date}
            />
            <p className="text-center font-register-body text-sm text-muted-foreground">
              Attendance is disabled for this day.
            </p>
          </div>
        ) : overview ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-register-body text-sm font-medium">
                <Sun className="h-4 w-4 text-[hsl(var(--register-stamp-late))]" />
                Morning Session
              </div>
              {morningStats && (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                    <StatCard count={morningStats.present} label="Present" stamp="present" />
                    <StatCard count={morningStats.late} label="Late" stamp="late" />
                    <StatCard count={morningStats.absent} label="Absent" stamp="absent" />
                    <StatCard count={morningStats.lateExcused + morningStats.absentExcused} label="Excused" stamp="excused" />
                    <StatCard count={morningStats.noClass} label="No Class" stamp="holiday" />
                    <StatCard count={morningStats.holiday} label="Holiday" stamp="holiday" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-register-body text-sm text-muted-foreground">Attendance Rate</span>
                    <AttendanceRateBadge rate={morningStats.rate} />
                  </div>
                  {morningStats.absentStudents.length > 0 && (
                    <div className="font-register-body text-sm">
                      <p className="text-muted-foreground mb-1">Absent Students:</p>
                      <ul className="font-register-mono text-xs space-y-0.5">
                        {morningStats.absentStudents.map((s) => (
                          <li key={s.user_id} className="flex items-center gap-2">
                            <span className="text-muted-foreground">{s.jsd_number}</span>
                            <span>{s.first_name} {s.last_name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {morningStats.absentStudents.length === 0 && morningStats.attended > 0 && (
                    <p className="font-register-body text-sm text-[hsl(var(--register-stamp-present))]">All students attended!</p>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-register-border/20 pt-4 space-y-3">
              <div className="flex items-center gap-2 font-register-body text-sm font-medium">
                <Sunset className="h-4 w-4 text-[hsl(var(--register-stamp-excused))]" />
                Afternoon Session
              </div>
              {afternoonStats && (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                    <StatCard count={afternoonStats.present} label="Present" stamp="present" />
                    <StatCard count={afternoonStats.late} label="Late" stamp="late" />
                    <StatCard count={afternoonStats.absent} label="Absent" stamp="absent" />
                    <StatCard count={afternoonStats.lateExcused + afternoonStats.absentExcused} label="Excused" stamp="excused" />
                    <StatCard count={afternoonStats.noClass} label="No Class" stamp="holiday" />
                    <StatCard count={afternoonStats.holiday} label="Holiday" stamp="holiday" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-register-body text-sm text-muted-foreground">Attendance Rate</span>
                    <AttendanceRateBadge rate={afternoonStats.rate} />
                  </div>
                  {afternoonStats.absentStudents.length > 0 && (
                    <div className="font-register-body text-sm">
                      <p className="text-muted-foreground mb-1">Absent Students:</p>
                      <ul className="font-register-mono text-xs space-y-0.5">
                        {afternoonStats.absentStudents.map((s) => (
                          <li key={s.user_id} className="flex items-center gap-2">
                            <span className="text-muted-foreground">{s.jsd_number}</span>
                            <span>{s.first_name} {s.last_name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {afternoonStats.absentStudents.length === 0 && afternoonStats.attended > 0 && (
                    <p className="font-register-body text-sm text-[hsl(var(--register-stamp-present))]">All students attended!</p>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-register-border/20 pt-4">
              <div className="flex items-center gap-4 font-register-body text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Total Students: {overview.students.length}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground font-register-body">
            No data available for this date
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-register-mono text-xs">
            Close
          </Button>
          {isHoliday ? (
            <Button variant="destructive" onClick={() => holiday?._id && onRemoveHoliday?.(holiday._id)} className="font-register-mono text-xs">
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Holiday
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onMarkAsHoliday?.(date)} className="font-register-mono text-xs">
                <Star className="h-4 w-4 mr-2" />
                Mark as Holiday
              </Button>
              <Button onClick={handleMarkAttendance} className="font-register-mono text-xs">
                Mark/Edit Attendance
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  function handleMarkAttendance() {
    onMarkAttendance();
    onOpenChange(false);
  }
}
