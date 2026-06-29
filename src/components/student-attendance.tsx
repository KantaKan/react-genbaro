"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  CalendarClock, RefreshCw, Clock, FileText, CheckCircle, XCircle, Info,
} from "lucide-react";
import { LeaveRequestForm } from "./leave-request-form";
import { SkeletonWarm } from "@/components/loading-skeleton";
import { AttendanceChart } from "./attendance-chart";
import { AttendanceFlipDigit } from "./attendance/attendance-flip-digit";

const getThailandDate = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const th = new Date(utc + 7 * 3600000);
  const year = th.getFullYear();
  const month = String(th.getMonth() + 1).padStart(2, "0");
  const day = String(th.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function StudentAttendance() {
  const { userData } = useUserData();
  const [code, setCode] = useState("");
  const [punchState, setPunchState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [punchMessage, setPunchMessage] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadAllData();
    return () => { if (successTimer.current) clearTimeout(successTimer.current); };
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
      const today = getThailandDate();
      setTodayRecords(history.filter((r) => r.date === today));
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
      setLeaveRequests(requests || []);
    } catch (error) {
      setLeaveRequests([]);
    }
  };

  const getCurrentSession = (): "morning" | "afternoon" | null => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const thHour = new Date(utc + 7 * 3600000).getHours();
    if (thHour >= 9 && thHour < 13) return "morning";
    if (thHour >= 13 && thHour < 17) return "afternoon";
    return null;
  };

  const getSessionFromCode = (code: string): "morning" | "afternoon" | null => {
    const upperCode = code.toUpperCase();
    if (upperCode.startsWith("MORNING")) return "morning";
    if (upperCode.startsWith("AFTERNOON")) return "afternoon";
    return getCurrentSession();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !userData?.cohort_number) return;

    const session = getSessionFromCode(code.trim());
    if (session) {
      const existingRecord = todayRecords.find((r) => r.session === session);
      if (existingRecord) {
        toast.info(`You're already marked as ${existingRecord.status} for ${session} session!`);
        setCode("");
        return;
      }
    }

    setPunchState("submitting");
    try {
      const result = await submitAttendance(code.trim(), userData.cohort_number);
      setPunchState("success");
      setPunchMessage(result.status === "present" ? "Present" : result.status === "late" ? "Late" : "Marked");
      setCode("");
      successTimer.current = setTimeout(() => {
        setPunchState("idle");
        setPunchMessage("");
        loadAllData();
      }, 2000);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || "Failed to submit attendance";
      setPunchState("error");
      setPunchMessage(message);
      successTimer.current = setTimeout(() => {
        setPunchState("idle");
        setPunchMessage("");
      }, 2500);
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
        <div className="register-alert register-alert-danger">
          <div className="flex gap-3">
            <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-register-heading text-sm uppercase tracking-[0.1em]">Attendance Warning - Critical</p>
              <p className="text-xs mt-1 opacity-80">
                You have <strong>{attendanceStatus.absent}</strong> absences. Please contact admin immediately.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (attendanceStatus.warning_level === "yellow") {
      return (
        <div className="register-alert register-alert-warning">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-register-heading text-sm uppercase tracking-[0.1em]">Attendance Warning</p>
              <p className="text-xs mt-1 opacity-80">
                You have <strong>{attendanceStatus.absent}</strong> absences. Please attend regularly.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const getTodayStatus = (session: "morning" | "afternoon") => {
    const record = todayRecords.find((r) => r.session === session);
    if (!record) {
      return <Stamp status="-" />;
    }
    return <Stamp status={record.status} />;
  };

  const pendingLeaveRequests = (leaveRequests || []).filter((r) => r.status === "pending");
  const status = attendanceStatus;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-register-heading text-2xl text-[hsl(var(--foreground))]">My Attendance</h1>
          <p className="font-register-body text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Student Register · {userData?.first_name} {userData?.last_name}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setLeaveDialogOpen(true)}
          className="border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--primary))]/10 font-register-body text-xs uppercase tracking-[0.1em] rounded-none"
        >
          <CalendarClock className="h-3.5 w-3.5 mr-2" />
          Request Leave
        </Button>
      </div>

      <div className="register-divider" />

      {getWarningAlert()}

      {pendingLeaveRequests.length > 0 && (
        <div className="register-alert register-alert-info">
          <div className="flex gap-3">
            <CalendarClock className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-register-heading text-sm uppercase tracking-[0.1em]">Pending Leave Requests</p>
              <p className="text-xs mt-1 opacity-80">
                You have {pendingLeaveRequests.length} pending leave request(s) awaiting approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Punch Clock Card — register slab with brass header */}
      <div className="register-card">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
          <Clock className="h-4 w-4" />
          <span className="font-register-heading text-xs uppercase tracking-[0.15em]">Punch Clock</span>
        </div>
        <div className="p-5">
          {punchState === "success" ? (
            <div className="flex flex-col items-center justify-center py-6 animate-stamp-in">
              <div className="w-14 h-14 rounded-full bg-[hsl(var(--register-stamp-present))]/10 border-2 border-[hsl(var(--register-stamp-present))] flex items-center justify-center mb-3">
                <CheckCircle className="h-7 w-7 text-[hsl(var(--register-stamp-present))]" />
              </div>
              <p className="font-register-heading text-lg text-[hsl(var(--register-stamp-present))]">{punchMessage}</p>
              <p className="font-register-mono text-xs text-[hsl(var(--muted-foreground))] mt-1">Attendance recorded</p>
            </div>
          ) : punchState === "error" ? (
            <div className="flex flex-col items-center justify-center py-6 animate-stamp-in">
              <div className="w-14 h-14 rounded-full bg-[hsl(var(--register-stamp-absent))]/10 border-2 border-[hsl(var(--register-stamp-absent))] flex items-center justify-center mb-3">
                <XCircle className="h-7 w-7 text-[hsl(var(--register-stamp-absent))]" />
              </div>
              <p className="font-register-body text-sm text-[hsl(var(--register-stamp-absent))] text-center">{punchMessage}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-register-mono text-[10px] uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] block mb-1.5">
                  Enter attendance code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. MORNING-ABCD"
                    disabled={punchState === "submitting"}
                    className="flex-1 h-10 px-3 bg-[hsl(var(--card))] border border-[hsl(var(--border))] font-register-mono text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]/50 focus:outline-none focus:border-[hsl(var(--primary))] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={punchState === "submitting" || !code.trim()}
                    className="px-5 h-10 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-register-heading text-xs uppercase tracking-[0.15em] hover:brightness-110 disabled:opacity-50 transition-all"
                  >
                    {punchState === "submitting" ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      "Punch"
                    )}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { loadAllData(); toast.info("Refreshed"); }}
                className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors font-register-body"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            </form>
          )}
        </div>
      </div>

      <Tabs defaultValue="today" className="space-y-4" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] border border-[hsl(var(--border))] rounded-none bg-[hsl(var(--card))]">
          {["today", "week", "month", "leave"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="font-register-heading text-[10px] uppercase tracking-[0.15em] data-[state=active]:bg-[hsl(var(--primary))] data-[state=active]:text-[hsl(var(--primary-foreground))] rounded-none"
            >
              {tab === "today" ? "Today" : tab === "week" ? "Week" : tab === "month" ? "Month" : "Leave"}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Today */}
        <TabsContent value="today" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="register-card">
              <div className="px-4 py-2.5 border-b border-[hsl(var(--border))]">
                <p className="font-register-heading text-xs uppercase tracking-[0.15em] text-[hsl(var(--foreground))]">
                  <SunIcon className="h-3.5 w-3.5 inline mr-1.5 text-[hsl(var(--register-stamp-late))]" />
                  Morning Session
                </p>
                <p className="font-register-mono text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">09:00 – 10:30</p>
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="font-register-body text-xs text-[hsl(var(--muted-foreground))]">Status</span>
                {isLoadingData ? <SkeletonWarm className="h-5 w-20" /> : getTodayStatus("morning")}
              </div>
            </div>

            <div className="register-card">
              <div className="px-4 py-2.5 border-b border-[hsl(var(--border))]">
                <p className="font-register-heading text-xs uppercase tracking-[0.15em] text-[hsl(var(--foreground))]">
                  <SunsetIcon className="h-3.5 w-3.5 inline mr-1.5 text-[hsl(var(--register-stamp-late))]" />
                  Afternoon Session
                </p>
                <p className="font-register-mono text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">13:00 – 14:30</p>
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="font-register-body text-xs text-[hsl(var(--muted-foreground))]">Status</span>
                {isLoadingData ? <SkeletonWarm className="h-5 w-20" /> : getTodayStatus("afternoon")}
              </div>
            </div>
          </div>

          {/* Quick stats flip digits */}
          {status && (
            <div className="register-card">
              <div className="px-4 py-2 border-b border-[hsl(var(--border))]">
                <p className="font-register-heading text-xs uppercase tracking-[0.15em] text-[hsl(var(--foreground))]">
                  <BarChart3 className="h-3.5 w-3.5 inline mr-1.5" />
                  Period Totals
                </p>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-center gap-6">
                  <AttendanceFlipDigit value={status.present} label="Present" />
                  <div className="w-px h-10 bg-[hsl(var(--border))]" />
                  <AttendanceFlipDigit value={status.late} label="Late" />
                  <div className="w-px h-10 bg-[hsl(var(--border))]" />
                  <AttendanceFlipDigit value={status.absent} label="Absent" />
                  <div className="w-px h-10 bg-[hsl(var(--border))]" />
                  <AttendanceFlipDigit value={status.late_excused} label="Exc Late" />
                  <div className="w-px h-10 bg-[hsl(var(--border))]" />
                  <AttendanceFlipDigit value={status.absent_excused} label="Exc Abs" />
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Week / Month */}
        <TabsContent value="week" className="space-y-4">
          <PeriodSummary status={attendanceStatus} isLoading={isLoadingStatus} period="Week" />
          <div className="register-card">
            <div className="px-4 py-2.5 border-b border-[hsl(var(--border))]">
              <p className="font-register-heading text-xs uppercase tracking-[0.15em] text-[hsl(var(--foreground))]">
                <BarChart3 className="h-3.5 w-3.5 inline mr-1.5" />
                Weekly Chart
              </p>
            </div>
            <div className="p-4">
              {isLoadingData ? (
                <SkeletonWarm className="h-[300px] w-full" />
              ) : (
                <AttendanceChart data={dailyStats} height={300} />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          <PeriodSummary status={attendanceStatus} isLoading={isLoadingStatus} period="Month" />
          <div className="register-card">
            <div className="px-4 py-2.5 border-b border-[hsl(var(--border))]">
              <p className="font-register-heading text-xs uppercase tracking-[0.15em] text-[hsl(var(--foreground))]">
                <BarChart3 className="h-3.5 w-3.5 inline mr-1.5" />
                Monthly Chart
              </p>
            </div>
            <div className="p-4">
              {isLoadingData ? (
                <SkeletonWarm className="h-[300px] w-full" />
              ) : (
                <AttendanceChart data={dailyStats} height={300} />
              )}
            </div>
          </div>
        </TabsContent>

        {/* Leave */}
        <TabsContent value="leave" className="space-y-4">
          <div className="register-card">
            <div className="px-4 py-2.5 border-b border-[hsl(var(--border))]">
              <p className="font-register-heading text-xs uppercase tracking-[0.15em] text-[hsl(var(--foreground))]">
                <FileText className="h-3.5 w-3.5 inline mr-1.5" />
                My Leave Requests
              </p>
            </div>
            <div className="p-4">
              {leaveRequests.length === 0 ? (
                <div className="text-center py-8 font-register-body text-sm text-[hsl(var(--muted-foreground))]">
                  No leave requests found
                </div>
              ) : (
                <div className="space-y-2">
                  {leaveRequests.map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center justify-between p-3 border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-register-body text-sm text-[hsl(var(--foreground))] capitalize truncate">
                            {request.type.replace("_", " ")}
                          </span>
                          {request.session && <Stamp status={request.session} />}
                        </div>
                        <p className="font-register-mono text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                          {new Date(request.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        {request.reason && (
                          <p className="font-register-body text-xs text-[hsl(var(--muted-foreground))] mt-1">
                            {request.reason}
                          </p>
                        )}
                      </div>
                      <LeaveStatusBadge status={request.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Rules — register slab */}
      <div className="register-card">
        <div className="px-4 py-2.5 border-b border-[hsl(var(--border))]">
          <p className="font-register-heading text-xs uppercase tracking-[0.15em] text-[hsl(var(--foreground))]">
            <Info className="h-3.5 w-3.5 inline mr-1.5" />
            Attendance Rules
          </p>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 font-register-body text-xs text-[hsl(var(--foreground))]">
            <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--register-stamp-present))]" />
            <span><strong>Present:</strong> Attend both morning AND afternoon</span>
          </div>
          <div className="flex items-center gap-2 font-register-body text-xs text-[hsl(var(--foreground))]">
            <XCircle className="h-3.5 w-3.5 text-[hsl(var(--register-stamp-absent))]" />
            <span><strong>Absent:</strong> Miss one or both sessions</span>
          </div>
          <div className="flex items-center gap-2 font-register-body text-xs text-[hsl(var(--foreground))]">
            <Info className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
            <span>Need to take leave? Use the "Request Leave" button above</span>
          </div>
        </div>
      </div>

      <LeaveRequestForm
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        onSuccess={() => loadLeaveRequests()}
      />
    </div>
  );
}

/* ==============================
   Stamp component — quick status badge
   ============================== */
function Stamp({ status }: { status: string }) {
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
    late_excused: "Excused",
    absent_excused: "Excused",
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

function LeaveStatusBadge({ status }: { status: string }) {
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

/* ==============================
   Period Summary
   ============================== */
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
      <div className="register-card">
        <div className="p-4 text-center font-register-body text-sm text-[hsl(var(--muted-foreground))]">
          Loading summary...
        </div>
      </div>
    );
  }

  const present = status?.present || 0;
  const late = status?.late || 0;
  const absent = status?.absent || 0;
  const lateExcused = status?.late_excused || 0;
  const absentExcused = status?.absent_excused || 0;

  return (
    <div className="register-card">
      <div className="px-4 py-2.5 border-b border-[hsl(var(--border))]">
        <p className="font-register-heading text-xs uppercase tracking-[0.15em] text-[hsl(var(--foreground))]">
          {period} Summary
        </p>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center mb-4">
          {[
            { label: "Present", value: present, color: "var(--register-stamp-present)" },
            { label: "Late", value: late, color: "var(--register-stamp-late)" },
            { label: "Absent", value: absent, color: "var(--register-stamp-absent)" },
            { label: "Late Ex", value: lateExcused, color: "var(--register-stamp-excused)" },
            { label: "Abs Ex", value: absentExcused, color: "var(--register-stamp-excused)" },
          ].map((item) => (
            <div key={item.label}>
              <p className="font-register-mono text-xl" style={{ color: `hsl(${item.color})` }}>{item.value}</p>
              <p className="font-register-mono text-[10px] text-[hsl(var(--muted-foreground))]">{item.label}</p>
            </div>
          ))}
          <div>
            <p className="font-register-mono text-xl text-[hsl(var(--primary))]">
              {(() => {
                const total = present + late + absent + lateExcused + absentExcused;
                return total > 0 ? Math.round(((present + late + lateExcused) / total) * 100) : 0;
              })()}%
            </p>
            <p className="font-register-mono text-[10px] text-[hsl(var(--muted-foreground))]">Rate</p>
          </div>
        </div>
        <div className="h-1.5 bg-[hsl(var(--background))] overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--register-stamp-present))] transition-all duration-500"
            style={{
              width: `${(() => {
                const total = present + late + absent + lateExcused + absentExcused;
                return total > 0 ? Math.round(((present + late + lateExcused) / total) * 100) : 0;
              })()}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* Icon helpers */
function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function SunsetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 18a5 5 0 0 0-10 0" />
      <line x1="12" y1="9" x2="12" y2="3" />
      <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" />
      <line x1="1" y1="18" x2="3" y2="18" />
      <line x1="21" y1="18" x2="23" y2="18" />
      <line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
      <line x1="23" y1="22" x2="1" y2="22" />
      <polyline points="16 5 12 9 8 5" />
    </svg>
  );
}

function BarChart3({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="20" x2="3" y2="10" />
      <line x1="9" y1="20" x2="9" y2="4" />
      <line x1="15" y1="20" x2="15" y2="8" />
      <line x1="21" y1="20" x2="21" y2="12" />
    </svg>
  );
}

function AlertTriangle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
