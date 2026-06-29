"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ChevronDown,
  Trash2,
  User,
  UserX,
  UserMinus,
  FileText,
} from "lucide-react";
import { AttendanceCalendar } from "@/components/attendance-calendar";
import { EditDayDialog } from "@/components/edit-day-dialog";
import { PageLoading } from "@/components/page-state";

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

function StatusStamp({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    present: "var(--register-stamp-present)",
    late: "var(--register-stamp-late)",
    absent: "var(--register-stamp-absent)",
    late_excused: "var(--register-stamp-excused)",
    absent_excused: "var(--register-stamp-excused)",
    no_class: "var(--register-stamp-excused)",
    holiday: "var(--register-stamp-holiday)",
    dropout: "var(--register-stamp-absent)",
    dismissed: "var(--register-stamp-absent)",
  };
  const labelMap: Record<string, string> = {
    present: "Present",
    late: "Late",
    absent: "Absent",
    late_excused: "Late Ex",
    absent_excused: "Abs Ex",
    no_class: "No Class",
    holiday: "Holiday",
    dropout: "Dropout",
    dismissed: "Dismissed",
  };
  const color = colorMap[status] || "var(--register-muted-ink)";
  const label = labelMap[status] || status;
  return (
    <span
      className="register-status-stamp"
      style={{
        borderColor: `hsl(${color})`,
        color: `hsl(${color})`,
        backgroundColor: `hsl(${color} / 0.08)`,
      }}
    >
      {label}
    </span>
  );
}

function WarningStamp({ level }: { level: string }) {
  if (level === "red") {
    return <span className="font-register-mono text-[10px] uppercase bg-[hsl(var(--register-stamp-absent))]/10 text-[hsl(var(--register-stamp-absent))] px-2 py-1">Critical Warning</span>;
  }
  if (level === "yellow") {
    return <span className="font-register-mono text-[10px] uppercase bg-[hsl(var(--register-stamp-late))]/10 text-[hsl(var(--register-stamp-late))] px-2 py-1">Warning</span>;
  }
  return <span className="font-register-mono text-[10px] uppercase text-[hsl(var(--register-stamp-present))]">Good Standing</span>;
}

function LeaveStatusStamp({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    approved: "var(--register-stamp-present)",
    rejected: "var(--register-stamp-absent)",
    pending: "var(--register-stamp-late)",
  };
  const color = colorMap[status] || "var(--register-muted-ink)";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className="register-status-stamp"
      style={{
        borderColor: `hsl(${color})`,
        color: `hsl(${color})`,
        backgroundColor: `hsl(${color} / 0.08)`,
      }}
    >
      {label}
    </span>
  );
}

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
    if (id) loadData();
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
        setLeaveRequests(leaves.filter((l) => l.user_id === id));
      } catch {
        setLeaveRequests([]);
      }
    } catch {
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
    status: "present" | "late" | "absent" | "late_excused" | "absent_excused" | "no_class" | "holiday" | "dropout" | "dismissed"
  ) => {
    try {
      await manualMarkAttendance(id!, records.find((r) => r._id === recordId)?.date || "", session, status);
      toast.success("Attendance updated");
      loadData();
    } catch {
      toast.error("Failed to update attendance");
    }
  };

  const handleClearRecord = async (recordId: string) => {
    try {
      await deleteAttendanceRecord(recordId);
      toast.success("Attendance cleared");
      loadData();
    } catch {
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

  if (isLoading) return <PageLoading label="Loading attendance..." />;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 font-register-body text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center">
            <User className="h-7 w-7 text-[hsl(var(--primary))]" />
          </div>
          <div>
            <h1 className="font-register-heading text-2xl text-[hsl(var(--foreground))]">
              {studentInfo?.first_name} {studentInfo?.last_name}
            </h1>
            <p className="font-register-mono text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
              {studentInfo?.jsd_number} | Cohort {studentInfo?.cohort_number}
            </p>
          </div>
        </div>
        <WarningStamp level={stats.warningLevel} />
      </div>

      <div className="register-divider" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Present", value: stats.present, color: "var(--register-stamp-present)" },
          { label: "Late", value: stats.late, color: "var(--register-stamp-late)" },
          { label: "Absent", value: stats.absent, color: "var(--register-stamp-absent)" },
          { label: "Excused", value: stats.lateExcused + stats.absentExcused, color: "var(--register-stamp-excused)" },
          { label: "Rate", value: `${stats.rate}%`, color: "var(--register-brass)" },
        ].map((item) => (
          <div
            key={item.label}
            className="register-card text-center"
          >
            <div className="p-3">
              <p className="font-register-mono text-xl" style={{ color: `hsl(${item.color})` }}>{item.value}</p>
              <p className="font-register-mono text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="register-card">
        <div className="px-4 py-2.5 border-b border-[hsl(var(--border))]">
          <p className="font-register-heading text-xs uppercase tracking-[0.15em] text-[hsl(var(--foreground))]">
            <Calendar className="h-3.5 w-3.5 inline mr-1.5" />
            Attendance Calendar
          </p>
          <p className="font-register-mono text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
            Click a day to edit
          </p>
        </div>
        <div className="p-4">
          <AttendanceCalendar
            records={calendarRecords}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onDayClick={handleDayClick}
          />
        </div>
      </div>

      <Tabs defaultValue="records" className="space-y-4">
        <TabsList className="border border-[hsl(var(--border))] rounded-none bg-[hsl(var(--card))]">
          {["records", "leave-requests"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="font-register-heading text-[10px] uppercase tracking-[0.15em] data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-[hsl(var(--primary-foreground))] rounded-none"
            >
              {tab === "records" ? "Attendance Records" : "Leave Requests"}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="records">
          <div className="register-card">
            <div className="px-4 py-2.5 border-b border-[hsl(var(--border))]">
              <span className="font-register-heading text-xs uppercase tracking-[0.15em] text-[hsl(var(--foreground))]">
                Records — {currentMonth}
              </span>
            </div>
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8 font-register-body text-sm text-[hsl(var(--muted-foreground))]">
                No records for this month
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 px-4 py-1.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))] font-register-mono text-[10px] uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))]">
                  <span className="flex-1">Date</span>
                  <span className="w-20 text-center">Session</span>
                  <span className="w-24 text-center">Status</span>
                  <span className="w-20 text-center">Marked By</span>
                  <span className="w-24 text-center">Actions</span>
                </div>
                <div className="border-t border-[hsl(var(--border))]">
                  {filteredRecords.map((record) => (
                    <div
                      key={record._id}
                      className="flex items-center gap-4 px-4 py-2 border-b border-[hsl(var(--border))]/50 last:border-b-0 hover:bg-[hsl(var(--primary))]/[0.02] transition-colors"
                    >
                      <span className="font-register-mono text-xs text-[hsl(var(--foreground))] flex-1">
                        {new Date(record.date).toLocaleDateString("en-US", {
                          weekday: "short", month: "short", day: "numeric",
                        })}
                      </span>
                      <span className="w-20 text-center font-register-mono text-xs capitalize text-[hsl(var(--foreground))]">
                        {record.session}
                      </span>
                      <span className="w-24 text-center flex justify-center">
                        <StatusStamp status={record.status} />
                      </span>
                      <span className="w-20 text-center font-register-mono text-xs capitalize text-[hsl(var(--foreground))]">
                        {record.marked_by}
                      </span>
                      <div className="w-24 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="px-2 py-1 border border-[hsl(var(--border))] font-register-mono text-[10px] text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary))] transition-colors">
                              Edit <ChevronDown className="h-3 w-3 ml-1 inline" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-none border-[hsl(var(--border))]">
                            {[
                              { label: "Present", status: "present" as const, icon: <CheckCircle className="h-4 w-4 mr-2 text-[hsl(var(--register-stamp-present))]" /> },
                              { label: "Late", status: "late" as const, icon: <Clock className="h-4 w-4 mr-2 text-[hsl(var(--register-stamp-late))]" /> },
                              { label: "Absent", status: "absent" as const, icon: <XCircle className="h-4 w-4 mr-2 text-[hsl(var(--register-stamp-absent))]" /> },
                              { label: "Late (Excused)", status: "late_excused" as const, icon: <Clock className="h-4 w-4 mr-2 text-[hsl(var(--register-stamp-excused))]" /> },
                              { label: "Absent (Excused)", status: "absent_excused" as const, icon: <Calendar className="h-4 w-4 mr-2 text-[hsl(var(--register-stamp-excused))]" /> },
                              { label: "No Class", status: "no_class" as const, icon: <Calendar className="h-4 w-4 mr-2 text-[hsl(var(--register-stamp-excused))]" /> },
                              { label: "Dropout", status: "dropout" as const, icon: <UserX className="h-4 w-4 mr-2 text-[hsl(var(--register-stamp-absent))]" /> },
                              { label: "Dismissed", status: "dismissed" as const, icon: <UserMinus className="h-4 w-4 mr-2 text-[hsl(var(--register-stamp-absent))]" /> },
                            ].map((item) => (
                              <DropdownMenuItem
                                key={item.status}
                                onClick={() => handleManualMark(record._id, record.session, item.status)}
                                className="font-register-body text-xs"
                              >
                                {item.icon} {item.label}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator className="bg-[hsl(var(--border))]" />
                            <DropdownMenuItem
                              onClick={() => handleClearRecord(record._id)}
                              className="font-register-body text-xs text-[hsl(var(--register-stamp-absent))]"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Clear
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="leave-requests">
          <div className="register-card">
            <div className="px-4 py-2.5 border-b border-[hsl(var(--border))]">
              <span className="font-register-heading text-xs uppercase tracking-[0.15em] text-[hsl(var(--foreground))]">
                <FileText className="h-3.5 w-3.5 inline mr-1.5" />
                Leave Requests
              </span>
            </div>
            {leaveRequests.length === 0 ? (
              <div className="text-center py-8 font-register-body text-sm text-[hsl(var(--muted-foreground))]">
                No leave requests
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 px-4 py-1.5 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary))] font-register-mono text-[10px] uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))]">
                  <span className="w-24">Type</span>
                  <span className="w-24">Date</span>
                  <span className="flex-1">Reason</span>
                  <span className="w-20 text-center">Status</span>
                </div>
                <div className="border-t border-[hsl(var(--border))]">
                  {leaveRequests.map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center gap-4 px-4 py-2 border-b border-[hsl(var(--border))]/50 last:border-b-0 hover:bg-[hsl(var(--primary))]/[0.02] transition-colors"
                    >
                      <span className="w-24 font-register-body text-xs capitalize text-[hsl(var(--foreground))]">
                        {request.type.replace("_", " ")}
                      </span>
                      <span className="w-24 font-register-mono text-xs text-[hsl(var(--foreground))]">
                        {new Date(request.date).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                      <span className="flex-1 font-register-body text-xs text-[hsl(var(--muted-foreground))] truncate max-w-[200px]">
                        {request.reason}
                      </span>
                      <span className="w-20 text-center flex justify-center">
                        <LeaveStatusStamp status={request.status} />
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
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
