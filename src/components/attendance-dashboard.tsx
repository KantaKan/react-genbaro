"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "react-toastify";
import { getCohort, getHolidays, deleteHoliday, type User, type Holiday } from "@/lib/api";
import { Trash2, RefreshCw, Clock, Calendar, X, CalendarClock, Check, ChevronDown, Loader2, Star, Users, Eye, ArrowUpDown, UserX, UserMinus } from "lucide-react";
import { LeaveRequestsTable } from "./leave-requests-table";
import { CreateLeaveRequestDialog } from "./create-leave-request-dialog";
import { AdminAttendanceCalendar } from "./admin-attendance-calendar";
import { DaySummaryDialog } from "./day-summary-dialog";
import { CreateHolidayDialog } from "./create-holiday-dialog";
import { AttendanceCodeCard } from "./attendance/attendance-code-card";
import { AttendanceStudentTable } from "./attendance/attendance-student-table";
import { AttendanceLogsSection } from "./attendance/attendance-logs-section";
import {
  useTodayOverview,
  useActiveAttendanceCode,
  useAttendanceStats,
  useAttendanceLogs,
  useGenerateAttendanceCode,
  useManualMarkAttendance,
  useBulkMarkAttendance,
  useDeleteAttendanceRecord,
} from "@/application/hooks/useAttendance";
import type { AttendanceSession, AttendanceStatusType, AttendanceRecord } from "@/domain/types";

interface AttendanceDashboardProps {
  cohort?: string;
}

const COHORTS = Array.from({ length: 12 }, (_, i) => i + 7);

// Thailand date in YYYY-MM-DD so it matches the backend's record date keying.
const getThailandDate = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const th = new Date(utc + 7 * 3600000);
  const year = th.getFullYear();
  const month = String(th.getMonth() + 1).padStart(2, "0");
  const day = String(th.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultStartDate = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const th = new Date(utc + 7 * 3600000);
  th.setDate(th.getDate() - 30);
  return `${th.getFullYear()}-${String(th.getMonth() + 1).padStart(2, "0")}-${String(th.getDate()).padStart(2, "0")}`;
};

export function AttendanceDashboard({ cohort }: AttendanceDashboardProps) {
  const navigate = useNavigate();
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
  const [activeTab, setActiveTab] = useState("overview");

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [createHolidayDialogOpen, setCreateHolidayDialogOpen] = useState(false);
  const [holidayDate, setHolidayDate] = useState<string>("");
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

  const [overviewSortDir, setOverviewSortDir] = useState<"asc" | "desc">("asc");

  const cohortNum = parseInt(selectedCohort);

  // ---- Data via React Query ----
  const overviewQuery = useTodayOverview(cohortNum, selectedDate);
  const morningCodeQuery = useActiveAttendanceCode(cohortNum, "morning");
  const afternoonCodeQuery = useActiveAttendanceCode(cohortNum, "afternoon");

  const statsQuery = useAttendanceStats(cohortNum, getDefaultStartDate(), getThailandDate());
  const isLogsTab = activeTab === "logs";
  const logsQuery = useAttendanceLogs(cohortNum, selectedDate, 1, 50, isLogsTab);

  // ---- Mutations ----
  const generateCode = useGenerateAttendanceCode();
  const manualMark = useManualMarkAttendance(cohortNum, selectedDate);
  const bulkMark = useBulkMarkAttendance(cohortNum, selectedDate);
  const deleteRecord = useDeleteAttendanceRecord(cohortNum, selectedDate);

  const overview = overviewQuery.data;
  const isMutating = manualMark.isLoading || bulkMark.isLoading;
  const morningCode = morningCodeQuery.data ?? null;
  const afternoonCode = afternoonCodeQuery.data ?? null;

  // ---- Non-query data loads ----
  const loadHolidays = async () => {
    try {
      setHolidays(await getHolidays());
    } catch (error) {
      console.error("Error loading holidays:", error);
      setHolidays([]);
    }
  };

  const loadStudents = async () => {
    try {
      setStudents(await getCohort(selectedCohort));
    } catch (error) {
      console.error("Error loading students:", error);
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
    statsQuery.refetch();
    logsQuery.refetch();
    morningCodeQuery.refetch();
    afternoonCodeQuery.refetch();
    loadHolidays();
  };

  const isHoliday = (date: string): Holiday | null => {
    if (!holidays || holidays.length === 0) return null;
    return holidays.find((h) => date >= h.start_date && date <= h.end_date) || null;
  };

  // Countdown timers for active codes.
  const [timeLeftMorning, setTimeLeftMorning] = useState("");
  const [timeLeftAfternoon, setTimeLeftAfternoon] = useState("");

  useEffect(() => {
    if (!morningCodeQuery.data) {
      setTimeLeftMorning("");
      return;
    }
    const expires = new Date(morningCodeQuery.data.expires_at).getTime();
    const interval = setInterval(() => {
      const diff = expires - Date.now();
      if (diff <= 0) {
        setTimeLeftMorning("Expired");
        morningCodeQuery.refetch();
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeftMorning(`${m}:${s.toString().padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [morningCodeQuery.data]);

  useEffect(() => {
    if (!afternoonCodeQuery.data) {
      setTimeLeftAfternoon("");
      return;
    }
    const expires = new Date(afternoonCodeQuery.data.expires_at).getTime();
    const interval = setInterval(() => {
      const diff = expires - Date.now();
      if (diff <= 0) {
        setTimeLeftAfternoon("Expired");
        afternoonCodeQuery.refetch();
      } else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeftAfternoon(`${m}:${s.toString().padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [afternoonCodeQuery.data]);

  const handleGenerateCode = (session: AttendanceSession) => {
    generateCode.mutate({ cohort: cohortNum, session });
  };

  const handleManualMark = (userId: string, session: AttendanceSession, status: AttendanceStatusType) => {
    manualMark.mutate({ userId, session, status });
  };

  const handleMarkAllPresent = () => {
    if (!overview?.students) return;
    const unmarked = overview.students.filter((s) => s.morning === "-" || s.afternoon === "-");
    if (unmarked.length === 0) {
      toast.info("All students already marked");
      return;
    }
    const morningUnmarked = unmarked.filter((s) => s.morning === "-").map((s) => s.user_id);
    const afternoonUnmarked = unmarked.filter((s) => s.afternoon === "-").map((s) => s.user_id);
    if (morningUnmarked.length > 0) {
      bulkMark.mutate({ userIds: morningUnmarked, session: "morning", status: "present" });
    }
    if (afternoonUnmarked.length > 0) {
      bulkMark.mutate({ userIds: afternoonUnmarked, session: "afternoon", status: "present" });
    }
  };

  const handleClearAttendance = (userId: string, session: AttendanceSession) => {
    const student = overview?.students.find((s) => s.user_id === userId);
    const recordId = session === "morning" ? student?.morning_record_id : student?.afternoon_record_id;
    if (!recordId) {
      toast.error("Attendance record not found. Please refresh and try again.");
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

  const handleOpenLeaveDialog = (student: { user_id: string; jsd_number: string; first_name: string; last_name: string }) => {
    setSelectedStudentForLeave(student);
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
    setActiveTab("overview");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-500 hover:bg-green-600">Present</Badge>;
      case "late":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Late</Badge>;
      case "absent":
        return <Badge className="bg-red-500 hover:bg-red-600">Absent</Badge>;
      case "late_excused":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Late Excused</Badge>;
      case "absent_excused":
        return <Badge className="bg-gray-500 hover:bg-gray-600">Absent Excused</Badge>;
      case "no_class":
        return <Badge className="bg-purple-500 hover:bg-purple-600">No Class</Badge>;
      case "holiday":
        return <Badge className="bg-orange-500 hover:bg-orange-600">Holiday</Badge>;
      case "dropout":
        return <Badge className="bg-red-700 hover:bg-red-800">Dropout</Badge>;
      case "dismissed":
        return <Badge className="bg-red-800 hover:bg-red-900">Dismissed</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const sortedOverviewStudents = useMemo(() => {
    if (!overview?.students) return [];
    const jsdNum = (jsd?: string) => {
      if (!jsd) return 9999;
      const match = jsd.match(/GEN\d+_(\d+)/i);
      return match ? parseInt(match[1], 10) : 9999;
    };
    return [...overview.students].sort((a, b) => {
      const diff = jsdNum(a.jsd_number) - jsdNum(b.jsd_number);
      return overviewSortDir === "asc" ? diff : -diff;
    });
  }, [overview?.students, overviewSortDir]);

  const logsData = (logsQuery.data as { logs?: AttendanceRecord[] } | undefined)?.logs ?? [];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">Manage class attendance and track student participation</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-[150px]"
          />
          <Select value={selectedCohort} onValueChange={handleCohortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Cohort" />
            </SelectTrigger>
            <SelectContent>
              {COHORTS.map((c) => (
                <SelectItem key={c} value={c.toString()}>Cohort {c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefreshAll}>
            <RefreshCw className={overviewQuery.isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-[750px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="all-students">All Students</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="leave-requests">Leave</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AttendanceCodeCard
              session="morning"
              title="Morning Session"
              description="9:00 - 10:30"
              gradientFrom="#3b82f6"
              gradientTo="#2563eb"
              textColor="text-blue-100"
              activeCode={morningCode}
              timeLeft={timeLeftMorning}
              isGenerating={generateCode.isLoading}
              onGenerate={handleGenerateCode}
            />
            <AttendanceCodeCard
              session="afternoon"
              title="Afternoon Session"
              description="13:00 - 14:30"
              gradientFrom="#9333ea"
              gradientTo="#7c3aed"
              textColor="text-purple-100"
              activeCode={afternoonCode}
              timeLeft={timeLeftAfternoon}
              isGenerating={generateCode.isLoading}
              onGenerate={handleGenerateCode}
            />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Attendance - {selectedDate}
                  </CardTitle>
                  {isHoliday(selectedDate) && (
                    <Badge className="bg-purple-500 text-white">
                      <Star className="h-3 w-3 mr-1 fill-yellow-300 text-yellow-300" />
                      {isHoliday(selectedDate)?.name || "Holiday"}
                    </Badge>
                  )}
                  {overviewQuery.isFetching && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <Button
                  onClick={handleMarkAllPresent}
                  size="sm"
                  variant="outline"
                  disabled={bulkMark.isLoading || !!isHoliday(selectedDate)}
                >
                  {isHoliday(selectedDate) ? (
                    <>
                      <Star className="h-4 w-4 mr-2" />
                      Holiday
                    </>
                  ) : bulkMark.isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Marking...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Mark All Present
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">
                      <button
                        onClick={() => setOverviewSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                        className="flex items-center gap-1.5 hover:text-foreground/70 transition-colors"
                        title={`Sort ${overviewSortDir === "asc" ? "descending" : "ascending"}`}
                      >
                        JSD #
                        <ArrowUpDown className="w-3 h-3 text-muted-foreground ml-1" />
                        <span className="text-muted-foreground/50 ml-1 text-[10px] normal-case font-normal whitespace-nowrap">{overviewSortDir === "asc" ? "↑" : "↓"}</span>
                      </button>
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Morning</TableHead>
                    <TableHead>Afternoon</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overviewQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading...</TableCell>
                    </TableRow>
                  ) : sortedOverviewStudents.map((student) => (
                    <TableRow key={student.user_id}>
                      <TableCell className="font-medium">{student.jsd_number}</TableCell>
                      <TableCell>{student.first_name} {student.last_name}</TableCell>
                      <TableCell>
                        {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : getStatusBadge(student.morning)}
                      </TableCell>
                      <TableCell>
                        {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : getStatusBadge(student.afternoon)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            onClick={() => navigate(`/admin/attendance/student/${student.user_id}`)}
                            title="View full details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleOpenLeaveDialog(student)}
                            title="Create leave request"
                          >
                            <CalendarClock className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant={student.morning !== "-" ? "default" : "outline"}
                                size="sm"
                                disabled={isMutating || deleteRecord.isLoading || !!isHoliday(selectedDate)}
                              >
                                AM {student.morning !== "-" ? "✓" : ""} <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "present")} disabled={!!isHoliday(selectedDate)}>
                                <Check className="h-4 w-4 mr-2 text-green-500" /> Present
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "late")} disabled={!!isHoliday(selectedDate)}>
                                <Clock className="h-4 w-4 mr-2 text-yellow-500" /> Late
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "absent")} disabled={!!isHoliday(selectedDate)}>
                                <X className="h-4 w-4 mr-2 text-red-500" /> Absent
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "late_excused")} disabled={!!isHoliday(selectedDate)}>
                                <Clock className="h-4 w-4 mr-2 text-blue-500" /> Late (Excused)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "absent_excused")} disabled={!!isHoliday(selectedDate)}>
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" /> Absent (Excused)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "no_class")}>
                                <Calendar className="h-4 w-4 mr-2 text-purple-500" /> No Class
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "holiday")}>
                                <Calendar className="h-4 w-4 mr-2 text-orange-500" /> Holiday
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "dropout")}>
                                <UserX className="h-4 w-4 mr-2 text-red-700" /> Dropout
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "dismissed")}>
                                <UserMinus className="h-4 w-4 mr-2 text-red-800" /> Dismissed
                              </DropdownMenuItem>
                              {student.morning !== "-" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleClearAttendance(student.user_id, "morning")} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" /> Clear
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant={student.afternoon !== "-" ? "default" : "outline"}
                                size="sm"
                                disabled={isMutating || deleteRecord.isLoading || !!isHoliday(selectedDate)}
                              >
                                PM {student.afternoon !== "-" ? "✓" : ""} <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "present")} disabled={!!isHoliday(selectedDate)}>
                                <Check className="h-4 w-4 mr-2 text-green-500" /> Present
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "late")} disabled={!!isHoliday(selectedDate)}>
                                <Clock className="h-4 w-4 mr-2 text-yellow-500" /> Late
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "absent")} disabled={!!isHoliday(selectedDate)}>
                                <X className="h-4 w-4 mr-2 text-red-500" /> Absent
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "late_excused")} disabled={!!isHoliday(selectedDate)}>
                                <Clock className="h-4 w-4 mr-2 text-blue-500" /> Late (Excused)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "absent_excused")} disabled={!!isHoliday(selectedDate)}>
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" /> Absent (Excused)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "no_class")}>
                                <Calendar className="h-4 w-4 mr-2 text-purple-500" /> No Class
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "holiday")}>
                                <Calendar className="h-4 w-4 mr-2 text-orange-500" /> Holiday
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "dropout")}>
                                <UserX className="h-4 w-4 mr-2 text-red-700" /> Dropout
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "dismissed")}>
                                <UserMinus className="h-4 w-4 mr-2 text-red-800" /> Dismissed
                              </DropdownMenuItem>
                              {student.afternoon !== "-" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleClearAttendance(student.user_id, "afternoon")} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" /> Clear
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-students" className="space-y-4">
          {statsQuery.isLoading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading stats...</CardContent></Card>
          ) : (
            <AttendanceStudentTable cohort={selectedCohort} stats={statsQuery.data ?? []} />
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <AdminAttendanceCalendar
            cohort={cohortNum}
            onDayClick={handleCalendarDayClick}
            holidays={holidays}
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          {logsQuery.isLoading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading logs...</CardContent></Card>
          ) : (
            <AttendanceLogsSection
              logs={logsData}
              onDelete={(log) => {
                setRecordToDelete({
                  id: log._id,
                  name: `${log.first_name} ${log.last_name}`,
                  session: log.session,
                  date: log.date,
                });
                setDeleteConfirmOpen(true);
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="leave-requests" className="space-y-4">
          <LeaveRequestsTable cohort={selectedCohort} />
        </TabsContent>
      </Tabs>

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
          logsQuery.refetch();
          statsQuery.refetch();
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
    </div>
  );
}
