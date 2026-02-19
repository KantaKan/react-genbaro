"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "react-toastify";
import {
  submitAttendance,
  getMyAttendanceStatus,
  getMyAttendanceHistory,
  getMyDailyStats,
  getMyLeaveRequests,
  type AttendanceStatus,
  type AttendanceRecord,
  type DailyStats,
  type LeaveRequest,
} from "@/lib/api";
import { useUserData } from "@/UserDataContext";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  RefreshCw,
  CalendarClock,
  Clock,
  Sun,
  Sunset,
  TrendingUp,
} from "lucide-react";
import { LeaveRequestForm } from "./leave-request-form";
import { AttendanceChart } from "./attendance-chart";

const getLocalDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split("T")[0];
};

export function StudentAttendance() {
  const { userData } = useUserData();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoadingData(true);
    await Promise.all([loadAttendanceStatus(), loadTodayRecords(), loadDailyStats(7), loadLeaveRequests()]);
    setIsLoadingData(false);
  };

  const loadAttendanceStatus = async () => {
    try {
      const status = await getMyAttendanceStatus();
      setAttendanceStatus(status);
    } catch (error) {
      console.error("Error loading attendance status:", error);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const loadTodayRecords = async () => {
    try {
      const history = await getMyAttendanceHistory(1);
      const today = getLocalDate();
      const todayRecs = history.filter((r) => r.date === today);
      setTodayRecords(todayRecs);
    } catch (error) {
      console.error("Error loading today records:", error);
    }
  };

  const loadDailyStats = async (days: number) => {
    try {
      const stats = await getMyDailyStats(days);
      setDailyStats(stats);
    } catch (error) {
      console.error("Error loading daily stats:", error);
    }
  };

  const loadLeaveRequests = async () => {
    try {
      const requests = await getMyLeaveRequests();
      setLeaveRequests(requests);
    } catch (error) {
      console.error("Error loading leave requests:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !userData?.cohort_number) return;

    setIsSubmitting(true);
    try {
      const result = await submitAttendance(code.trim(), userData.cohort_number);
      toast.success(`Attendance submitted! Status: ${result.status}`);
      setCode("");
      loadAllData();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || "Failed to submit attendance";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (value: string) => {
    const days = value === "week" ? 7 : value === "month" ? 30 : 1;
    if (value !== "today") {
      loadDailyStats(days);
    }
  };

  const getWarningAlert = () => {
    if (!attendanceStatus) return null;

    if (attendanceStatus.warning_level === "red") {
      return (
        <Alert className="bg-red-50 border-red-500 dark:bg-red-950 dark:border-red-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-red-700 dark:text-red-400 font-bold">
            Attendance Warning - Critical
          </AlertTitle>
          <AlertDescription className="text-red-600 dark:text-red-300">
            You have <strong>{attendanceStatus.absent}</strong> absences. Please contact admin
            immediately.
          </AlertDescription>
        </Alert>
      );
    }

    if (attendanceStatus.warning_level === "yellow") {
      return (
        <Alert className="bg-yellow-50 border-yellow-500 dark:bg-yellow-950 dark:border-yellow-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-yellow-700 dark:text-yellow-400 font-bold">
            Attendance Warning
          </AlertTitle>
          <AlertDescription className="text-yellow-600 dark:text-yellow-300">
            You have <strong>{attendanceStatus.absent}</strong> absences. Please attend regularly.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  const getTodayStatus = (session: "morning" | "afternoon") => {
    const record = todayRecords.find((r) => r.session === session);
    if (!record) {
      return <Badge variant="outline" className="text-muted-foreground">Not marked</Badge>;
    }
    switch (record.status) {
      case "present":
        return <Badge className="bg-green-500 hover:bg-green-600">Present</Badge>;
      case "late":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Late</Badge>;
      case "absent":
        return <Badge className="bg-red-500 hover:bg-red-600">Absent</Badge>;
      case "late_excused":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Late (Excused)</Badge>;
      case "absent_excused":
        return <Badge className="bg-gray-500 hover:bg-gray-600">Absent (Excused)</Badge>;
      default:
        return <Badge variant="outline">{record.status}</Badge>;
    }
  };

  const pendingLeaveRequests = leaveRequests.filter((r) => r.status === "pending");

  const present = attendanceStatus?.present || 0;
  const late = attendanceStatus?.late || 0;
  const absent = attendanceStatus?.absent || 0;
  const lateExcused = attendanceStatus?.late_excused || 0;
  const absentExcused = attendanceStatus?.absent_excused || 0;
  const totalSessions = present + late + absent + lateExcused + absentExcused;
  const attendanceRate = totalSessions > 0 ? Math.round(((present + late + lateExcused) / totalSessions) * 100) : 0;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Attendance</h1>
          <p className="text-muted-foreground">Track your attendance and leave requests</p>
        </div>
        <Button onClick={() => setLeaveDialogOpen(true)} className="w-full sm:w-auto">
          <CalendarClock className="h-4 w-4 mr-2" />
          Request Leave
        </Button>
      </div>

      {getWarningAlert()}

      {pendingLeaveRequests.length > 0 && (
        <Alert className="bg-blue-50 border-blue-500 dark:bg-blue-950 dark:border-blue-800">
          <CalendarClock className="h-4 w-4" />
          <AlertTitle className="text-blue-700 dark:text-blue-400">Pending Leave Requests</AlertTitle>
          <AlertDescription className="text-blue-600 dark:text-blue-300">
            You have {pendingLeaveRequests.length} pending leave request(s) awaiting approval.
          </AlertDescription>
        </Alert>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white pb-3">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Mark Attendance
          </CardTitle>
          <CardDescription className="text-blue-100">
            Enter the code from your instructor
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              placeholder="Enter code (e.g., MORN-ABCD)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="flex-1"
            />
            <Button type="submit" disabled={isSubmitting || !code.trim()} className="w-full sm:w-auto">
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </form>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              loadAllData();
              toast.info("Refreshed attendance data");
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="today" className="space-y-4" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sun className="h-5 w-5 text-orange-500" />
                  Morning Session
                </CardTitle>
                <CardDescription>9:00 - 10:30</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  {isLoadingData ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    getTodayStatus("morning")
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sunset className="h-5 w-5 text-purple-500" />
                  Afternoon Session
                </CardTitle>
                <CardDescription>13:00 - 14:30</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  {isLoadingData ? (
                    <span className="text-muted-foreground">Loading...</span>
                  ) : (
                    getTodayStatus("afternoon")
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <TodaySummary
            status={attendanceStatus}
            leaveRequests={pendingLeaveRequests}
            isLoading={isLoadingStatus}
          />
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <PeriodSummary status={attendanceStatus} isLoading={isLoadingStatus} period="Week" />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <AttendanceChart data={dailyStats} height={300} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          <PeriodSummary status={attendanceStatus} isLoading={isLoadingStatus} period="Month" />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <AttendanceChart data={dailyStats} height={300} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>
                <strong>Present:</strong> Attend both morning AND afternoon
              </span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>
                <strong>Absent:</strong> Miss one or both sessions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <span>
                Need to take leave? Use the "Request Leave" button above
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {leaveRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              My Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaveRequests.slice(0, 5).map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {request.type.replace("_", " ")}
                      </span>
                      {request.session && (
                        <Badge variant="outline" className="text-xs">
                          {request.session}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  {request.status === "approved" && (
                    <Badge className="bg-green-500">Approved</Badge>
                  )}
                  {request.status === "rejected" && (
                    <Badge className="bg-red-500">Rejected</Badge>
                  )}
                  {request.status === "pending" && (
                    <Badge className="bg-yellow-500">Pending</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <LeaveRequestForm
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        onSuccess={() => {
          loadLeaveRequests();
        }}
      />
    </div>
  );
}

function TodaySummary({
  status,
  leaveRequests,
  isLoading,
}: {
  status: AttendanceStatus | null;
  leaveRequests: LeaveRequest[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading summary...</p>
        </CardContent>
      </Card>
    );
  }

  const present = status?.present || 0;
  const late = status?.late || 0;
  const absent = status?.absent || 0;
  const lateExcused = status?.late_excused || 0;
  const absentExcused = status?.absent_excused || 0;
  const totalSessions = present + late + absent + lateExcused + absentExcused;
  const attendanceRate = totalSessions > 0 ? Math.round(((present + late + lateExcused) / totalSessions) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-green-600">{present}</p>
          <p className="text-xs text-green-700 dark:text-green-400">Present</p>
        </div>
        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <Clock className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-yellow-600">{late}</p>
          <p className="text-xs text-yellow-700 dark:text-yellow-400">Late</p>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
          <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-red-600">{absent}</p>
          <p className="text-xs text-red-700 dark:text-red-400">Absent</p>
        </div>
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <Clock className="h-5 w-5 text-blue-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-blue-600">{lateExcused}</p>
          <p className="text-xs text-blue-700 dark:text-blue-400">Late Excused</p>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 col-span-2 sm:col-span-1">
          <Info className="h-5 w-5 text-gray-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-gray-600">{absentExcused}</p>
          <p className="text-xs text-gray-700 dark:text-gray-400">Absent Excused</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Attendance Rate</span>
            <span className="text-xl font-bold">{attendanceRate}%</span>
          </div>
          <Progress value={attendanceRate} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Based on attended sessions (Present + Late + Excused)
          </p>
        </CardContent>
      </Card>

      {leaveRequests.length > 0 && (
        <Alert className="bg-yellow-50 border-yellow-500 dark:bg-yellow-950 dark:border-yellow-800">
          <CalendarClock className="h-4 w-4" />
          <AlertTitle className="text-yellow-700 dark:text-yellow-400">
            Pending Leave Requests
          </AlertTitle>
          <AlertDescription className="text-yellow-600 dark:text-yellow-300">
            You have {leaveRequests.length} pending leave request(s) awaiting approval.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function PeriodSummary({
  status,
  isLoading,
  period,
}: {
  status: AttendanceStatus | null;
  isLoading: boolean;
  period: string;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading summary...</p>
        </CardContent>
      </Card>
    );
  }

  const present = status?.present || 0;
  const late = status?.late || 0;
  const absent = status?.absent || 0;
  const lateExcused = status?.late_excused || 0;
  const absentExcused = status?.absent_excused || 0;
  const totalSessions = present + late + absent + lateExcused + absentExcused;
  const attendanceRate = totalSessions > 0 ? Math.round(((present + late + lateExcused) / totalSessions) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{period} Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center mb-4">
          <div>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{present}</p>
            <p className="text-xs text-muted-foreground">Present</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">{late}</p>
            <p className="text-xs text-muted-foreground">Late</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-red-600">{absent}</p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{lateExcused}</p>
            <p className="text-xs text-muted-foreground">Late Ex</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold text-gray-600">{absentExcused}</p>
            <p className="text-xs text-muted-foreground">Abs Ex</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold">{attendanceRate}%</p>
            <p className="text-xs text-muted-foreground">Rate</p>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${attendanceRate}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
