"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "react-toastify";
import {
  getStudentAttendanceHistory,
  getAllLeaveRequests,
  manualMarkAttendance,
  deleteAttendanceRecord,
  type AttendanceRecord,
  type LeaveRequest,
} from "@/lib/api";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  ChevronDown,
  Trash2,
  User,
} from "lucide-react";
import { AttendanceCalendar } from "@/components/attendance-calendar";
import { EditDayDialog } from "@/components/edit-day-dialog";

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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
      return <Badge className="bg-blue-500 hover:bg-blue-600">Late (Excused)</Badge>;
    case "absent_excused":
      return <Badge className="bg-gray-500 hover:bg-gray-600">Absent (Excused)</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getWarningBadge = (level: string) => {
  switch (level) {
    case "red":
      return <Badge className="bg-red-500">Critical Warning</Badge>;
    case "yellow":
      return <Badge className="bg-yellow-500">Warning</Badge>;
    default:
      return <Badge className="bg-green-500">Good Standing</Badge>;
  }
};

export function StudentAttendanceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [studentInfo, setStudentInfo] = useState<{
    first_name: string;
    last_name: string;
    jsd_number: string;
    cohort_number: number;
  } | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const history = await getStudentAttendanceHistory(id!);
      setRecords(history);

      if (history.length > 0) {
        setStudentInfo({
          first_name: history[0].first_name,
          last_name: history[0].last_name,
          jsd_number: history[0].jsd_number,
          cohort_number: history[0].cohort_number,
        });
      }

      try {
        const leaves = await getAllLeaveRequests();
        const studentLeaves = leaves.filter((l) => l.user_id === id);
        setLeaveRequests(studentLeaves);
      } catch {
        setLeaveRequests([]);
      }
    } catch (error) {
      toast.error("Failed to load attendance data");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = () => {
    const present = records.filter((r) => r.status === "present").length;
    const late = records.filter((r) => r.status === "late").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const lateExcused = records.filter((r) => r.status === "late_excused").length;
    const absentExcused = records.filter((r) => r.status === "absent_excused").length;
    const total = present + late + absent + lateExcused + absentExcused;
    const rate = total > 0 ? Math.round(((present + late + lateExcused + absentExcused) / total) * 100) : 0;

    let warningLevel = "normal";
    if (absent >= 7) warningLevel = "red";
    else if (absent >= 4) warningLevel = "yellow";

    return { present, late, absent, lateExcused, absentExcused, total, rate, warningLevel };
  };

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setEditDialogOpen(true);
  };

  const handleManualMark = async (
    recordId: string,
    session: "morning" | "afternoon",
    status: "present" | "late" | "absent" | "late_excused" | "absent_excused"
  ) => {
    try {
      await manualMarkAttendance(id!, records.find((r) => r._id === recordId)?.date || "", session, status);
      toast.success("Attendance updated");
      loadData();
    } catch (error) {
      toast.error("Failed to update attendance");
    }
  };

  const handleClearRecord = async (recordId: string) => {
    try {
      await deleteAttendanceRecord(recordId);
      toast.success("Attendance cleared");
      loadData();
    } catch (error) {
      toast.error("Failed to clear attendance");
    }
  };

  const getRecordsForDate = (date: string) => {
    const morning = records.find((r) => r.date === date && r.session === "morning");
    const afternoon = records.find((r) => r.date === date && r.session === "afternoon");
    return { morning, afternoon };
  };

  const calendarRecords = records.map((r) => ({
    date: r.date,
    session: r.session as "morning" | "afternoon",
    status: r.status,
  }));

  const stats = calculateStats();

  const selectedDateRecords = selectedDate ? getRecordsForDate(selectedDate) : { morning: null, afternoon: null };

  const filteredRecords = records
    .filter((r) => {
      const [year, month] = currentMonth.split("-").map(Number);
      const recordDate = new Date(r.date);
      return recordDate.getFullYear() === year && recordDate.getMonth() === month - 1;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {studentInfo?.first_name} {studentInfo?.last_name}
            </h1>
            <p className="text-muted-foreground">
              {studentInfo?.jsd_number} | Cohort {studentInfo?.cohort_number}
            </p>
          </div>
        </div>
        <div>{getWarningBadge(stats.warningLevel)}</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="pt-4 pb-3 text-center">
            <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            <p className="text-xs text-muted-foreground">Present</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-4 pb-3 text-center">
            <Clock className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
            <p className="text-xs text-muted-foreground">Late</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-4 pb-3 text-center">
            <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4 pb-3 text-center">
            <Calendar className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-600">{stats.lateExcused + stats.absentExcused}</p>
            <p className="text-xs text-muted-foreground">Excused</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1 border-primary/20">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{stats.rate}%</p>
            <p className="text-xs text-muted-foreground">Attendance Rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance Calendar
          </CardTitle>
          <CardDescription>Click on a day to edit attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceCalendar
            records={calendarRecords}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onDayClick={handleDayClick}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="records" className="space-y-4">
        <TabsList>
          <TabsTrigger value="records">Attendance Records</TabsTrigger>
          <TabsTrigger value="leave-requests">Leave Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records - {currentMonth}</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRecords.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No records for this month</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Marked By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>
                          {new Date(record.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="capitalize">{record.session}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="capitalize">{record.marked_by}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Edit <ChevronDown className="h-3 w-3 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleManualMark(record._id, record.session, "present")}
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Present
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleManualMark(record._id, record.session, "late")}
                              >
                                <Clock className="h-4 w-4 mr-2 text-yellow-500" /> Late
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleManualMark(record._id, record.session, "absent")}
                              >
                                <XCircle className="h-4 w-4 mr-2 text-red-500" /> Absent
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleManualMark(record._id, record.session, "late_excused")}
                              >
                                <Clock className="h-4 w-4 mr-2 text-blue-500" /> Late (Excused)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleManualMark(record._id, record.session, "absent_excused")}
                              >
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" /> Absent (Excused)
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleClearRecord(record._id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Clear
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave-requests">
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {leaveRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No leave requests</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((request) => (
                      <TableRow key={request._id}>
                        <TableCell className="capitalize">{request.type.replace("_", " ")}</TableCell>
                        <TableCell>
                          {new Date(request.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{request.reason}</TableCell>
                        <TableCell>
                          {request.status === "approved" && (
                            <Badge className="bg-green-500">Approved</Badge>
                          )}
                          {request.status === "rejected" && (
                            <Badge className="bg-red-500">Rejected</Badge>
                          )}
                          {request.status === "pending" && (
                            <Badge className="bg-yellow-500">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditDayDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        userId={id!}
        date={selectedDate}
        morningStatus={selectedDateRecords.morning?.status}
        afternoonStatus={selectedDateRecords.afternoon?.status}
        morningRecordId={selectedDateRecords.morning?._id}
        afternoonRecordId={selectedDateRecords.afternoon?._id}
        onSuccess={loadData}
      />
    </div>
  );
}
