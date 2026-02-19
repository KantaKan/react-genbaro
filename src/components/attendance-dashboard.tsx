"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "react-toastify";
import { 
  generateAttendanceCode, 
  getActiveAttendanceCode, 
  manualMarkAttendance,
  getAttendanceLogs,
  getAttendanceStats,
  getStudentAttendanceHistory,
  getTodayOverview,
  deleteAttendanceRecord,
  getDailyAttendanceStats,
  getCohort,
  bulkMarkAttendance,
  type AttendanceCode,
  type AttendanceRecord,
  type AttendanceStats,
  type TodayOverview,
  type DailyStats,
  type User
} from "@/lib/api";
import { Trash2, RefreshCw, Clock, AlertTriangle, TrendingUp, Calendar, X, CalendarClock, Check, ChevronDown, Users, Eye, CalendarDays } from "lucide-react";
import { LeaveRequestsTable } from "./leave-requests-table";
import { CreateLeaveRequestDialog } from "./create-leave-request-dialog";
import { AdminAttendanceCalendar } from "./admin-attendance-calendar";
import { DaySummaryDialog } from "./day-summary-dialog";

interface AttendanceDashboardProps {
  cohort?: string;
}

const COHORTS = Array.from({ length: 12 }, (_, i) => i + 7);

// Get today's date in YYYY-MM-DD format (local timezone)
const getLocalDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split("T")[0];
};

export function AttendanceDashboard({ cohort }: AttendanceDashboardProps) {
  const navigate = useNavigate();
  const [selectedCohort, setSelectedCohort] = useState<string>("11");
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDate());
  const [activeCodeMorning, setActiveCodeMorning] = useState<AttendanceCode | null>(null);
  const [activeCodeAfternoon, setActiveCodeAfternoon] = useState<AttendanceCode | null>(null);
  const [timeLeftMorning, setTimeLeftMorning] = useState<string>("");
  const [timeLeftAfternoon, setTimeLeftAfternoon] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [todayOverview, setTodayOverview] = useState<TodayOverview | null>(null);
  const [stats, setStats] = useState<AttendanceStats[]>([]);
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<AttendanceStats | null>(null);
  const [studentHistory, setStudentHistory] = useState<AttendanceRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedDays, setSelectedDays] = useState<7 | 30>(7);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<{id: string; name: string; session: string; date: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<User[]>([]);
  const [createLeaveDialogOpen, setCreateLeaveDialogOpen] = useState(false);
  const [selectedStudentForLeave, setSelectedStudentForLeave] = useState<{user_id: string; jsd_number: string; first_name: string; last_name: string} | null>(null);
  const [daySummaryOpen, setDaySummaryOpen] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");

  // Load cohort from localStorage on mount
  useEffect(() => {
    const savedCohort = localStorage.getItem("attendance_cohort");
    if (savedCohort) {
      setSelectedCohort(savedCohort);
    } else if (cohort) {
      setSelectedCohort(cohort);
    }
  }, [cohort]);

  // Save cohort to localStorage when changed
  const handleCohortChange = (value: string) => {
    setSelectedCohort(value);
    localStorage.setItem("attendance_cohort", value);
  };

  const loadTodayOverview = useCallback(async () => {
    const cohortNum = parseInt(selectedCohort);
    try {
      const [morning, afternoon, overview] = await Promise.all([
        getActiveAttendanceCode(cohortNum, "morning"),
        getActiveAttendanceCode(cohortNum, "afternoon"),
        getTodayOverview(cohortNum, undefined, selectedDate)
      ]);
      setActiveCodeMorning(morning);
      setActiveCodeAfternoon(afternoon);
      setTodayOverview(overview);
    } catch (error) {
      console.error("Error loading overview:", error);
    }
  }, [selectedCohort, selectedDate]);

  const loadStats = useCallback(async () => {
    const cohortNum = parseInt(selectedCohort);
    try {
      const statsData = await getAttendanceStats(cohortNum);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, [selectedCohort]);

  const loadDailyStats = async () => {
    try {
      const data = await getDailyAttendanceStats(parseInt(selectedCohort), selectedDays);
      setDailyStats(data);
    } catch (error) {
      console.error("Error loading daily stats:", error);
    }
  };

  const loadStudents = async () => {
    try {
      const users = await getCohort(selectedCohort);
      setStudents(users);
    } catch (error) {
      console.error("Error loading students:", error);
    }
  };

  const loadLogs = async () => {
    try {
      const data = await getAttendanceLogs(parseInt(selectedCohort), selectedDate);
      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (error) {
      console.error("Error loading logs:", error);
      setLogs([]);
    }
  };

  // Load data when cohort, date, or selectedDays changes
  useEffect(() => {
    loadTodayOverview();
    loadStats();
    loadDailyStats();
    loadLogs();
    loadStudents();
  }, [selectedCohort, selectedDate, selectedDays, loadTodayOverview, loadStats]);

  // Countdown timers
  useEffect(() => {
    if (activeCodeMorning) {
      const interval = setInterval(() => {
        const now = new Date();
        const expires = new Date(activeCodeMorning.expires_at);
        const diff = expires.getTime() - now.getTime();
        if (diff <= 0) {
          setTimeLeftMorning("Expired");
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeftMorning(`${minutes}:${seconds.toString().padStart(2, "0")}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeCodeMorning]);

  useEffect(() => {
    if (activeCodeAfternoon) {
      const interval = setInterval(() => {
        const now = new Date();
        const expires = new Date(activeCodeAfternoon.expires_at);
        const diff = expires.getTime() - now.getTime();
        if (diff <= 0) {
          setTimeLeftAfternoon("Expired");
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeftAfternoon(`${minutes}:${seconds.toString().padStart(2, "0")}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeCodeAfternoon]);

  const handleGenerateCode = async (session: "morning" | "afternoon") => {
    setIsGenerating(true);
    try {
      const code = await generateAttendanceCode(parseInt(selectedCohort), session);
      if (session === "morning") {
        setActiveCodeMorning(code);
      } else {
        setActiveCodeAfternoon(code);
      }
      toast.success(`Generated ${session} code: ${code.code}`);
      loadTodayOverview();
    } catch {
      toast.error("Failed to generate code");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualMark = async (userId: string, session: "morning" | "afternoon", status: "present" | "late" | "absent" | "late_excused" | "absent_excused") => {
    try {
      await manualMarkAttendance(userId, selectedDate, session, status);
      toast.success("Attendance marked");
      loadTodayOverview();
      loadLogs();
      loadStats();
    } catch (error) {
      toast.error("Failed to mark attendance");
    }
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAttendanceRecord(recordToDelete.id);
      toast.success("Attendance removed");
      setDeleteConfirmOpen(false);
      setRecordToDelete(null);
      loadTodayOverview();
      loadLogs();
      loadStats();
    } catch (error) {
      toast.error("Failed to remove attendance");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAttendance = async (userId: string, session: "morning" | "afternoon") => {
    const record = logs.find(l => l.user_id === userId && l.session === session && l.date === selectedDate);
    if (record) {
      setRecordToDelete({ id: record._id, name: "", session, date: selectedDate });
      setIsDeleting(true);
      try {
        await deleteAttendanceRecord(record._id);
        toast.success("Attendance cleared");
        loadTodayOverview();
        loadLogs();
        loadStats();
      } catch (error) {
        toast.error("Failed to clear attendance");
      } finally {
        setIsDeleting(false);
        setRecordToDelete(null);
      }
    }
  };

  const handleMarkAllPresent = async () => {
    if (!todayOverview?.students) return;
    
    const unmarkedStudents = todayOverview.students.filter(s => s.morning === "-" || s.afternoon === "-");
    if (unmarkedStudents.length === 0) {
      toast.info("All students already marked");
      return;
    }
    
    setIsLoading(true);
    try {
      const userIds = unmarkedStudents.map(s => s.user_id);
      
      const morningUnmarked = unmarkedStudents.filter(s => s.morning === "-").map(s => s.user_id);
      const afternoonUnmarked = unmarkedStudents.filter(s => s.afternoon === "-").map(s => s.user_id);
      
      if (morningUnmarked.length > 0) {
        await bulkMarkAttendance(morningUnmarked, selectedDate, "morning", "present");
      }
      if (afternoonUnmarked.length > 0) {
        await bulkMarkAttendance(afternoonUnmarked, selectedDate, "afternoon", "present");
      }
      
      toast.success(`Marked ${unmarkedStudents.length} students as present`);
      loadTodayOverview();
      loadLogs();
      loadStats();
    } catch (error) {
      toast.error("Failed to mark all present");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewStudentHistory = async (student: AttendanceStats) => {
    setSelectedStudent(student);
    setIsLoadingHistory(true);
    try {
      const history = await getStudentAttendanceHistory(student.user_id);
      setStudentHistory(history);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleOpenLeaveDialog = (student: {user_id: string; jsd_number: string; first_name: string; last_name: string}) => {
    setSelectedStudentForLeave(student);
    setCreateLeaveDialogOpen(true);
  };

  const handleCalendarDayClick = (date: string) => {
    setSelectedCalendarDate(date);
    setDaySummaryOpen(true);
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
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getWarningBadge = (level: string) => {
    switch (level) {
      case "red":
        return <Badge className="bg-red-500">Critical</Badge>;
      case "yellow":
        return <Badge className="bg-yellow-500">Warning</Badge>;
      default:
        return <Badge className="bg-green-500">Good</Badge>;
    }
  };

  const maxDailyTotal = Math.max(...dailyStats.map(d => d.total), 1);

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
          <Button variant="outline" size="icon" onClick={() => {
            loadTodayOverview();
            loadStats();
            loadLogs();
            loadDailyStats();
          }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 lg:w-[850px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="leave-requests">Leave</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  Morning Session
                </CardTitle>
                <CardDescription className="text-blue-100">9:00 - 10:30</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <Button 
                  onClick={() => handleGenerateCode("morning")}
                  disabled={isGenerating}
                  className="w-full"
                  variant={activeCodeMorning ? "outline" : "default"}
                >
                  {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  {activeCodeMorning ? "Regenerate Code" : "Generate Code"}
                </Button>
                {activeCodeMorning && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Code</p>
                    <p className="text-3xl font-bold font-mono tracking-wider">{activeCodeMorning.code}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Expires in: <span className="font-semibold text-primary">{timeLeftMorning}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  Afternoon Session
                </CardTitle>
                <CardDescription className="text-purple-100">13:00 - 14:30</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <Button 
                  onClick={() => handleGenerateCode("afternoon")}
                  disabled={isGenerating}
                  className="w-full"
                  variant={activeCodeAfternoon ? "outline" : "default"}
                >
                  {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  {activeCodeAfternoon ? "Regenerate Code" : "Generate Code"}
                </Button>
                {activeCodeAfternoon && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Code</p>
                    <p className="text-3xl font-bold font-mono tracking-wider">{activeCodeAfternoon.code}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Expires in: <span className="font-semibold text-primary">{timeLeftAfternoon}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Attendance - {selectedDate}
                </CardTitle>
                <Button onClick={handleMarkAllPresent} size="sm" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Mark All Present
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">JSD</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Morning</TableHead>
                    <TableHead>Afternoon</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayOverview?.students.map((student) => (
                    <TableRow key={student.user_id}>
                      <TableCell className="font-medium">{student.jsd_number}</TableCell>
                      <TableCell>{student.first_name} {student.last_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(student.morning)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(student.afternoon)}
                        </div>
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
                              <Button variant={student.morning !== "-" ? "default" : "outline"} size="sm">
                                AM {student.morning !== "-" ? "✓" : ""} <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "present")}>
                                <Check className="h-4 w-4 mr-2 text-green-500" /> Present
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "late")}>
                                <Clock className="h-4 w-4 mr-2 text-yellow-500" /> Late
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "absent")}>
                                <X className="h-4 w-4 mr-2 text-red-500" /> Absent
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "late_excused")}>
                                <Clock className="h-4 w-4 mr-2 text-blue-500" /> Late (Excused)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "morning", "absent_excused")}>
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" /> Absent (Excused)
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
                              <Button variant={student.afternoon !== "-" ? "default" : "outline"} size="sm">
                                PM {student.afternoon !== "-" ? "✓" : ""} <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "present")}>
                                <Check className="h-4 w-4 mr-2 text-green-500" /> Present
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "late")}>
                                <Clock className="h-4 w-4 mr-2 text-yellow-500" /> Late
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "absent")}>
                                <X className="h-4 w-4 mr-2 text-red-500" /> Absent
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "late_excused")}>
                                <Clock className="h-4 w-4 mr-2 text-blue-500" /> Late (Excused)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManualMark(student.user_id, "afternoon", "absent_excused")}>
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" /> Absent (Excused)
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

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Absence Stats
              </CardTitle>
              <CardDescription>Present = Morning + Afternoon attended</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>JSD</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-center">Present Days</TableHead>
                    <TableHead className="text-center">Absent Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((stat) => (
                    <TableRow key={stat.user_id}>
                      <TableCell className="font-medium">{stat.jsd_number}</TableCell>
                      <TableCell>{stat.first_name} {stat.last_name}</TableCell>
                      <TableCell className="text-center text-green-600 font-bold">{stat.present}</TableCell>
                      <TableCell className="text-center text-red-600 font-bold">{stat.absent}</TableCell>
                      <TableCell>{getWarningBadge(stat.warning_level)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/admin/attendance/student/${stat.user_id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewStudentHistory(stat)}
                          >
                            History
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <AdminAttendanceCalendar
            cohort={parseInt(selectedCohort)}
            onDayClick={handleCalendarDayClick}
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Select value={selectedDays.toString()} onValueChange={(v) => setSelectedDays(parseInt(v) as 7 | 30)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-500">{dailyStats.reduce((sum, d) => sum + d.present, 0)}</p>
                  <p className="text-sm text-muted-foreground">Present Days</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-500">{dailyStats.reduce((sum, d) => sum + d.absent, 0)}</p>
                  <p className="text-sm text-muted-foreground">Absent Days</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-500">{dailyStats.reduce((sum, d) => sum + d.total, 0)}</p>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{dailyStats.length}</p>
                  <p className="text-sm text-muted-foreground">Days Tracked</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Daily Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-end gap-2">
                {dailyStats.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                      style={{ height: `${(day.present / maxDailyTotal) * 200}px`, minHeight: day.present > 0 ? '4px' : '0' }}
                    />
                    <div 
                      className="w-full bg-red-500"
                      style={{ height: `${(day.absent / maxDailyTotal) * 200}px`, minHeight: day.absent > 0 ? '4px' : '0' }}
                    />
                    <p className="text-[10px] text-muted-foreground rotate-45 mt-2">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span className="text-sm">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded" />
                  <span className="text-sm">Absent</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>JSD</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.filter(l => !l.deleted).map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>{log.date}</TableCell>
                      <TableCell>{log.jsd_number}</TableCell>
                      <TableCell>{log.first_name} {log.last_name}</TableCell>
                      <TableCell className="capitalize">{log.session}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="capitalize">{log.marked_by}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => {
                            setRecordToDelete({ 
                              id: log._id, 
                              name: `${log.first_name} ${log.last_name}`, 
                              session: log.session,
                              date: log.date
                            });
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave-requests" className="space-y-4">
          <LeaveRequestsTable cohort={selectedCohort} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              History - {selectedStudent?.first_name} {selectedStudent?.last_name}
            </DialogTitle>
            <DialogDescription>
              JSD: {selectedStudent?.jsd_number} | Present: {selectedStudent?.present} | Absent: {selectedStudent?.absent}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingHistory ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : (
                  studentHistory.filter(h => !h.deleted).map((record) => (
                    <TableRow key={record._id}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell className="capitalize">{record.session}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="capitalize">{record.marked_by}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

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
            <Button variant="destructive" onClick={handleDeleteRecord} disabled={isDeleting}>
              {isDeleting ? "Removing..." : "Remove"}
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
        students={students}
        preselectedStudent={selectedStudentForLeave || undefined}
        defaultDate={selectedDate}
        onSuccess={() => {
          loadTodayOverview();
          loadLogs();
          loadStats();
        }}
      />

      <DaySummaryDialog
        open={daySummaryOpen}
        onOpenChange={setDaySummaryOpen}
        date={selectedCalendarDate}
        cohort={parseInt(selectedCohort)}
        onMarkAttendance={handleGoToAttendance}
      />
    </div>
  );
}
