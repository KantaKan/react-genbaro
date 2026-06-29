"use client";

import { useState, useEffect, useMemo, createContext, useContext } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "react-toastify";
import { getCohort, getHolidays, deleteHoliday, type User, type Holiday } from "@/lib/api";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { AttendanceFlipDigit } from "./attendance/attendance-flip-digit";
import { CreateLeaveRequestDialog } from "./create-leave-request-dialog";
import { DaySummaryDialog } from "./day-summary-dialog";
import { CreateHolidayDialog } from "./create-holiday-dialog";
import {
  useTodayOverview,
  useManualMarkAttendance,
  useBulkMarkAttendance,
  useDeleteAttendanceRecord,
} from "@/application/hooks/useAttendance";
import type { AttendanceSession, AttendanceStatusType } from "@/domain/types";

const COHORTS = Array.from({ length: 12 }, (_, i) => i + 7);

const getThailandDate = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const th = new Date(utc + 7 * 3600000);
  const year = th.getFullYear();
  const month = String(th.getMonth() + 1).padStart(2, "0");
  const day = String(th.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface AttendanceContextValue {
  selectedCohort: string;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  navigateDay: (dir: number) => void;
  goToToday: () => void;
  isToday: boolean;
  isMutating: boolean;
  overview: any;
  overviewQuery: any;
  students: User[];
  holidays: Holiday[];
  holidayToday: Holiday | null;
  perNameCounts: { present: number; absent: number };
  handleRefreshAll: () => void;
  handleManualMark: (userId: string, session: AttendanceSession, status: AttendanceStatusType) => void;
  handleMarkAllPresent: () => void;
  handleClearAttendance: (userId: string, session: AttendanceSession) => void;
  handleOpenLeaveDialog: (userId: string, jsd: string, first: string, last: string) => void;
  handleCalendarDayClick: (date: string, isHol: boolean, holiday?: Holiday) => void;
  onViewDetails: (userId: string) => void;
  setSelectedCohort: (c: string) => void;
  handleDeleteFromLogs: (log: any) => void;
}

const AttendanceCtx = createContext<AttendanceContextValue | null>(null);

export const useAttendanceContext = () => {
  const ctx = useContext(AttendanceCtx);
  if (!ctx) throw new Error("useAttendanceContext must be used within AttendanceShell");
  return ctx;
};

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  register: { title: "Daily Register", subtitle: "" },
  "all-students": { title: "All Students", subtitle: "attendance summary" },
  calendar: { title: "Attendance Calendar", subtitle: "Monthly overview and management" },
  logs: { title: "Attendance Logs", subtitle: "Audit trail of all markings" },
  leave: { title: "Leave Requests", subtitle: "Manage leave requests" },
};

export function AttendanceShell({ cohort }: { cohort?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split("/").pop() || "register";

  const [selectedCohort, setSelectedCohort] = useState<string>(
    () => localStorage.getItem("attendance_cohort") || cohort || "11"
  );
  const [selectedDate, setSelectedDate] = useState<string>(getThailandDate());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<{ id: string; name: string; session: string; date: string } | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [createLeaveDialogOpen, setCreateLeaveDialogOpen] = useState(false);
  const [selectedStudentForLeave, setSelectedStudentForLeave] = useState<{ user_id: string; jsd_number: string; first_name: string; last_name: string } | null>(null);
  const [daySummaryOpen, setDaySummaryOpen] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>("");
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [createHolidayDialogOpen, setCreateHolidayDialogOpen] = useState(false);
  const [holidayDate, setHolidayDate] = useState<string>("");
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

  const cohortNum = parseInt(selectedCohort);

  const overviewQuery = useTodayOverview(cohortNum, selectedDate);
  const manualMark = useManualMarkAttendance(cohortNum, selectedDate);
  const bulkMark = useBulkMarkAttendance(cohortNum, selectedDate);
  const deleteRecord = useDeleteAttendanceRecord(cohortNum, selectedDate);

  const overview = overviewQuery.data;
  const isMutating = manualMark.isLoading || bulkMark.isLoading;

  const loadHolidays = async () => {
    try {
      setHolidays(await getHolidays());
    } catch {
      setHolidays([]);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await getCohort(selectedCohort);
      setStudents(data ?? []);
    } catch {
      setStudents([]);
    }
  };

  useEffect(() => {
    if (cohort) {
      setSelectedCohort(cohort);
      localStorage.setItem("attendance_cohort", cohort);
    }
  }, [cohort]);

  useEffect(() => {
    loadHolidays();
    loadStudents();
  }, [selectedCohort]);

  const handleCohortChange = (value: string) => {
    setSelectedCohort(value);
    localStorage.setItem("attendance_cohort", value);
  };

  const handleRefreshAll = () => {
    overviewQuery.refetch();
    loadHolidays();
  };

  const isHolidayFn = (date: string): Holiday | null => {
    if (!holidays || holidays.length === 0) return null;
    return holidays.find((h) => date >= h.start_date && date <= h.end_date) || null;
  };

  const handleManualMark = (userId: string, session: AttendanceSession, status: AttendanceStatusType) => {
    manualMark.mutate({ userId, session, status });
  };

  const handleMarkAllPresent = () => {
    if (!overview?.students) return;
    const unmarked = overview.students.filter((s: any) => s.morning === "-" || s.afternoon === "-");
    if (unmarked.length === 0) {
      toast.info("All students already marked");
      return;
    }
    const morningUnmarked = unmarked.filter((s: any) => s.morning === "-").map((s: any) => s.user_id);
    const afternoonUnmarked = unmarked.filter((s: any) => s.afternoon === "-").map((s: any) => s.user_id);
    if (morningUnmarked.length > 0) {
      bulkMark.mutate({ userIds: morningUnmarked, session: "morning", status: "present" });
    }
    if (afternoonUnmarked.length > 0) {
      bulkMark.mutate({ userIds: afternoonUnmarked, session: "afternoon", status: "present" });
    }
  };

  const handleClearAttendance = (userId: string, session: AttendanceSession) => {
    const student = overview?.students.find((s: any) => s.user_id === userId);
    const recordId = session === "morning" ? student?.morning_record_id : student?.afternoon_record_id;
    if (!recordId) {
      toast.error("Attendance record not found");
      overviewQuery.refetch();
      return;
    }
    setRecordToDelete({
      id: recordId,
      name: `${student?.first_name ?? ""} ${student?.last_name ?? ""}`,
      session,
      date: selectedDate,
    });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!recordToDelete) return;
    deleteRecord.mutate(recordToDelete.id, {
      onSettled: () => {
        setDeleteConfirmOpen(false);
        setRecordToDelete(null);
      },
    });
  };

  const handleOpenLeaveDialog = (userId: string, jsd: string, first: string, last: string) => {
    setSelectedStudentForLeave({ user_id: userId, jsd_number: jsd, first_name: first, last_name: last });
    setCreateLeaveDialogOpen(true);
  };

  const handleCalendarDayClick = (date: string, isHol: boolean, holiday?: Holiday) => {
    if (isHol && holiday) {
      setSelectedHoliday(holiday);
      setHolidayDate(date);
      setDaySummaryOpen(true);
    } else {
      setSelectedCalendarDate(date);
      setDaySummaryOpen(true);
    }
  };

  const handleMarkAsHoliday = (date: string) => {
    setHolidayDate(date);
    setSelectedHoliday(null);
    setCreateHolidayDialogOpen(true);
    setDaySummaryOpen(false);
  };

  const handleRemoveHoliday = async (holidayId: string) => {
    try {
      await deleteHoliday(holidayId);
      toast.success("Holiday removed");
      loadHolidays();
      setDaySummaryOpen(false);
      setSelectedHoliday(null);
    } catch {
      toast.error("Failed to remove holiday");
    }
  };

  const handleGoToAttendance = () => {
    setSelectedDate(selectedCalendarDate);
    navigate("/admin/attendance/register");
  };

  const navigateDay = (direction: number) => {
    const current = new Date(selectedDate + "T12:00:00+07:00");
    current.setDate(current.getDate() + direction);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const goToToday = () => {
    setSelectedDate(getThailandDate());
  };

  const isToday = selectedDate === getThailandDate();
  const holidayToday = isHolidayFn(selectedDate);
  const isRegisterTab = activeTab === "register";

  const perNameCounts = useMemo(() => {
    if (!overview?.students) return { present: 0, absent: 0 };
    let present = 0;
    let absent = 0;
    for (const student of overview.students) {
      const hasAbsent = student.morning === "absent" || student.morning === "absent_excused" || student.morning === "late_excused"
        || student.afternoon === "absent" || student.afternoon === "absent_excused" || student.afternoon === "late_excused";
      const hasPresentOrLate = student.morning === "present" || student.morning === "late"
        || student.afternoon === "present" || student.afternoon === "late";
      if (hasAbsent) {
        absent++;
      } else if (hasPresentOrLate) {
        present++;
      }
    }
    return { present, absent };
  }, [overview?.students]);

  const tabInfo = TAB_TITLES[activeTab] || TAB_TITLES.register;

  const handleDeleteFromLogs = (log: any) => {
    setRecordToDelete({
      id: log._id,
      name: `${log.first_name} ${log.last_name}`,
      session: log.session,
      date: log.date,
    });
    setDeleteConfirmOpen(true);
  };

  const ctx: AttendanceContextValue = {
    selectedCohort, selectedDate, setSelectedDate,
    navigateDay, goToToday, isToday, isMutating,
    overview, overviewQuery, students, holidays, holidayToday, perNameCounts,
    handleRefreshAll, handleManualMark, handleMarkAllPresent, handleClearAttendance,
    handleOpenLeaveDialog, handleCalendarDayClick,
    onViewDetails: (userId: string) => navigate(`/admin/attendance/student/${userId}`),
    setSelectedCohort: handleCohortChange,
    handleDeleteFromLogs,
  };

  return (
    <AttendanceCtx.Provider value={ctx}>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <div className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-register-heading text-2xl text-[hsl(var(--foreground))]">
                {tabInfo.title}
              </h1>
              <p className="font-register-body text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
                Cohort {selectedCohort} · {tabInfo.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Select value={selectedCohort} onValueChange={handleCohortChange}>
                <SelectTrigger className="h-7 w-28 text-xs rounded-none border-[hsl(var(--border))] font-register-mono">
                  <SelectValue placeholder="Cohort" />
                </SelectTrigger>
                <SelectContent>
                  {COHORTS.map((c) => (
                    <SelectItem key={c} value={c.toString()}>Cohort {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigateDay(-1)}
                  className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-7 w-36 text-xs rounded-none border-[hsl(var(--border))] font-register-mono"
                />
                <button
                  onClick={() => navigateDay(1)}
                  className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                {!isToday && (
                  <button
                    onClick={goToToday}
                    className="px-2 py-1 text-[10px] uppercase tracking-[0.1em] font-register-mono text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 transition-colors"
                  >
                    Today
                  </button>
                )}
              </div>

              <button
                onClick={handleRefreshAll}
                className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${overviewQuery.isFetching ? "animate-spin" : ""}`} />
              </button>

              {isRegisterTab && !holidayToday && (
                <>
                  <div className="w-px h-8 bg-[hsl(var(--border))]" />
                  <AttendanceFlipDigit value={perNameCounts.present} label="Present" />
                  <div className="w-px h-8 bg-[hsl(var(--border))]" />
                  <AttendanceFlipDigit value={perNameCounts.absent} label="Absent" />
                </>
              )}
            </div>
          </div>

          <div className="register-divider" />

          <Outlet />
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Attendance</DialogTitle>
            <DialogDescription>
              Remove {recordToDelete?.name}'s {recordToDelete?.session} attendance for {recordToDelete?.date}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteRecord.isLoading}>
              {deleteRecord.isLoading ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateLeaveRequestDialog
        open={createLeaveDialogOpen}
        onOpenChange={(open) => {
          setCreateLeaveDialogOpen(open);
          if (!open) setSelectedStudentForLeave(null);
        }}
        students={students.map((u) => ({ user_id: u._id, jsd_number: u.jsd_number ?? "", first_name: u.first_name, last_name: u.last_name }))}
        preselectedStudent={selectedStudentForLeave || undefined}
        defaultDate={selectedDate}
        onSuccess={() => {
          overviewQuery.refetch();
        }}
      />

      <DaySummaryDialog
        open={daySummaryOpen}
        onOpenChange={setDaySummaryOpen}
        date={selectedCalendarDate || holidayDate}
        cohort={cohortNum}
        onMarkAttendance={handleGoToAttendance}
        holiday={selectedHoliday}
        onMarkAsHoliday={handleMarkAsHoliday}
        onRemoveHoliday={handleRemoveHoliday}
      />

      <CreateHolidayDialog
        open={createHolidayDialogOpen}
        onOpenChange={setCreateHolidayDialogOpen}
        selectedDate={holidayDate}
        onSuccess={() => loadHolidays()}
      />
    </AttendanceCtx.Provider>
  );
}
