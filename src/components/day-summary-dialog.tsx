"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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

  const getSessionStats = (students: TodayOverview["students"], session: "morning" | "afternoon") => {
    const present = students.filter((s) => s[session] === "present").length;
    const late = students.filter((s) => s[session] === "late").length;
    const absent = students.filter((s) => s[session] === "absent").length;
    const lateExcused = students.filter((s) => s[session] === "late_excused").length;
    const absentExcused = students.filter((s) => s[session] === "absent_excused").length;
    const total = students.length;
    const attended = present + late + lateExcused + absentExcused;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
    const absentStudents = students.filter((s) => s[session] === "absent");

    return { present, late, absent, lateExcused, absentExcused, total, attended, rate, absentStudents };
  };

  const handleMarkAttendance = () => {
    onMarkAttendance();
    onOpenChange(false);
  };

  const handleMarkAsHoliday = () => {
    onMarkAsHoliday?.(date);
  };

  const handleRemoveHoliday = () => {
    if (holiday?._id) {
      onRemoveHoliday?.(holiday._id);
    }
  };

  const morningStats = overview ? getSessionStats(overview.students, "morning") : null;
  const afternoonStats = overview ? getSessionStats(overview.students, "afternoon") : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {formatDate(date)}
            {isHoliday && (
              <Badge className="bg-purple-500 text-white ml-2">
                <Star className="h-3 w-3 mr-1 fill-yellow-300 text-yellow-300" />
                Holiday
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
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
            <div className="text-center p-6 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <Star className="h-12 w-12 mx-auto mb-3 text-purple-500 fill-purple-200" />
              <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                {holiday?.name || "Holiday"}
              </h3>
              {holiday?.description && (
                <p className="text-sm text-muted-foreground mt-2">{holiday.description}</p>
              )}
              {holiday?.start_date !== holiday?.end_date && (
                <p className="text-xs text-muted-foreground mt-2">
                  {holiday?.start_date} to {holiday?.end_date}
                </p>
              )}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Attendance is disabled for this day.
            </p>
          </div>
        ) : overview ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sun className="h-4 w-4 text-orange-500" />
                Morning Session
              </div>
              {morningStats && (
                <>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                      <p className="text-lg font-bold text-green-600">{morningStats.present}</p>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                      <p className="text-lg font-bold text-yellow-600">{morningStats.late}</p>
                      <p className="text-xs text-muted-foreground">Late</p>
                    </div>
                    <div className="p-2 bg-red-50 dark:bg-red-950 rounded">
                      <p className="text-lg font-bold text-red-600">{morningStats.absent}</p>
                      <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                      <p className="text-lg font-bold text-blue-600">{morningStats.lateExcused + morningStats.absentExcused}</p>
                      <p className="text-xs text-muted-foreground">Excused</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Attendance Rate</span>
                    <Badge variant={morningStats.rate >= 90 ? "default" : morningStats.rate >= 70 ? "secondary" : "destructive"}>
                      {morningStats.rate}%
                    </Badge>
                  </div>
                  {morningStats.absentStudents.length > 0 && (
                    <div className="text-sm">
                      <p className="text-muted-foreground mb-1">Absent Students:</p>
                      <ul className="text-xs space-y-0.5">
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
                    <p className="text-sm text-green-600">All students attended!</p>
                  )}
                </>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sunset className="h-4 w-4 text-purple-500" />
                Afternoon Session
              </div>
              {afternoonStats && (
                <>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                      <p className="text-lg font-bold text-green-600">{afternoonStats.present}</p>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                    <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
                      <p className="text-lg font-bold text-yellow-600">{afternoonStats.late}</p>
                      <p className="text-xs text-muted-foreground">Late</p>
                    </div>
                    <div className="p-2 bg-red-50 dark:bg-red-950 rounded">
                      <p className="text-lg font-bold text-red-600">{afternoonStats.absent}</p>
                      <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
                      <p className="text-lg font-bold text-blue-600">{afternoonStats.lateExcused + afternoonStats.absentExcused}</p>
                      <p className="text-xs text-muted-foreground">Excused</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Attendance Rate</span>
                    <Badge variant={afternoonStats.rate >= 90 ? "default" : afternoonStats.rate >= 70 ? "secondary" : "destructive"}>
                      {afternoonStats.rate}%
                    </Badge>
                  </div>
                  {afternoonStats.absentStudents.length > 0 && (
                    <div className="text-sm">
                      <p className="text-muted-foreground mb-1">Absent Students:</p>
                      <ul className="text-xs space-y-0.5">
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
                    <p className="text-sm text-green-600">All students attended!</p>
                  )}
                </>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Total Students: {overview.students.length}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No data available for this date
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {isHoliday ? (
            <Button variant="destructive" onClick={handleRemoveHoliday}>
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Holiday
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleMarkAsHoliday}>
                <Star className="h-4 w-4 mr-2" />
                Mark as Holiday
              </Button>
              <Button onClick={handleMarkAttendance}>
                Mark/Edit Attendance
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
