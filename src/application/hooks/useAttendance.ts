import { useQuery, useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { attendanceService } from "../services";
import type {
  AttendanceSession,
  AttendanceStatusType,
  AttendanceRecord,
  AttendanceStats,
  TodayOverview,
  DailyStats,
} from "../../domain/types";

export const attendanceKeys = {
  all: ["attendance"] as const,
  overview: (cohort: number, date: string, session?: AttendanceSession) =>
    ["attendance", "overview", cohort, date, session ?? "any"] as const,
  stats: (cohort: number, startDate?: string, endDate?: string) =>
    ["attendance", "stats", cohort, startDate ?? "all", endDate ?? "all"] as const,
  dailyStats: (cohort: number, startDate?: string, endDate?: string) =>
    ["attendance", "daily-stats", cohort, startDate ?? "all", endDate ?? "all"] as const,
  logs: (cohort: number, date?: string, page = 1, limit = 50) =>
    ["attendance", "logs", cohort, date ?? "all", page, limit] as const,
  studentHistory: (userId: string) =>
    ["attendance", "student-history", userId] as const,
  activeCode: (cohort: number, session: AttendanceSession) =>
    ["attendance", "code", cohort, session] as const,
};

export function useTodayOverview(cohort: number, date: string, session?: AttendanceSession) {
  return useQuery<TodayOverview>(
    attendanceKeys.overview(cohort, date, session),
    () => attendanceService.getTodayOverview(cohort, session, date),
    {
      enabled: !!cohort && !!date,
      staleTime: 15_000,
    }
  );
}

export function useActiveAttendanceCode(cohort: number, session: AttendanceSession, enabled = true) {
  return useQuery(
    attendanceKeys.activeCode(cohort, session),
    () => attendanceService.getActiveAttendanceCode(cohort, session),
    {
      enabled: enabled && !!cohort,
      staleTime: 30_000,
    }
  );
}

export function useAttendanceStats(cohort: number, startDate?: string, endDate?: string) {
  return useQuery<AttendanceStats[]>(
    attendanceKeys.stats(cohort, startDate, endDate),
    () => attendanceService.getAttendanceStats(cohort, startDate, endDate),
    {
      enabled: !!cohort,
    }
  );
}

export function useDailyAttendanceStats(cohort: number, startDate?: string, endDate?: string) {
  return useQuery<DailyStats[]>(
    attendanceKeys.dailyStats(cohort, startDate, endDate),
    () => attendanceService.getDailyAttendanceStats(cohort, startDate, endDate),
    {
      enabled: !!cohort,
    }
  );
}

export function useAttendanceLogs(cohort: number, date?: string, page = 1, limit = 50, enabled = true) {
  return useQuery(
    attendanceKeys.logs(cohort, date, page, limit),
    () => attendanceService.getAttendanceLogs(cohort, date, page, limit),
    {
      enabled: enabled && !!cohort,
    }
  );
}

export function useStudentHistory(userId?: string) {
  return useQuery<AttendanceRecord[]>(
    attendanceKeys.studentHistory(userId ?? ""),
    () => attendanceService.getStudentAttendanceHistory(userId as string),
    {
      enabled: !!userId,
    }
  );
}

export function useGenerateAttendanceCode() {
  const queryClient = useQueryClient();
  return useMutation(
    (vars: { cohort: number; session: AttendanceSession }) =>
      attendanceService.generateAttendanceCode(vars.cohort, vars.session),
    {
      onSuccess: (data, vars) => {
        queryClient.setQueryData(attendanceKeys.activeCode(vars.cohort, vars.session), data);
        toast.success(`Generated ${vars.session} code: ${data.code}`);
      },
      onError: () => {
        toast.error("Failed to generate code");
      },
    }
  );
}

// Invalidate every attendance view for a cohort so the UI reflects a write.
function invalidateCohort(queryClient: ReturnType<typeof useQueryClient>, cohort: number, date?: string) {
  queryClient.invalidateQueries(["attendance", "overview", cohort]);
  queryClient.invalidateQueries(["attendance", "logs", cohort]);
  queryClient.invalidateQueries(["attendance", "stats", cohort]);
  queryClient.invalidateQueries(["attendance", "daily-stats", cohort]);
  if (date) {
    queryClient.invalidateQueries(["attendance", "overview", cohort, date]);
  }
}

export function useManualMarkAttendance(cohort: number, date: string) {
  const queryClient = useQueryClient();
  return useMutation(
    (vars: { userId: string; session: AttendanceSession; status: AttendanceStatusType }) =>
      attendanceService.manualMarkAttendance(vars.userId, date, vars.session, vars.status),
    {
      onSuccess: () => {
        invalidateCohort(queryClient, cohort, date);
      },
      onError: () => {
        toast.error("Failed to mark attendance");
      },
    }
  );
}

export function useBulkMarkAttendance(cohort: number, date: string) {
  const queryClient = useQueryClient();
  return useMutation(
    (vars: { userIds: string[]; session: AttendanceSession; status: AttendanceStatusType }) =>
      attendanceService.bulkMarkAttendance(vars.userIds, date, vars.session, vars.status),
    {
      onSuccess: () => {
        invalidateCohort(queryClient, cohort, date);
      },
      onError: () => {
        toast.error("Failed to mark attendance in bulk");
      },
    }
  );
}

export function useDeleteAttendanceRecord(cohort: number, date: string) {
  const queryClient = useQueryClient();
  return useMutation(
    (recordId: string) => attendanceService.deleteAttendanceRecord(recordId),
    {
      onSuccess: () => {
        invalidateCohort(queryClient, cohort, date);
        toast.success("Attendance cleared");
      },
      onError: () => {
        toast.error("Failed to clear attendance");
      },
    }
  );
}

export function useLockAttendance(cohort: number, date: string) {
  const queryClient = useQueryClient();
  return useMutation(
    (vars: { date: string; session: AttendanceSession; locked: boolean }) =>
      attendanceService.lockAttendance(vars.date, vars.session, vars.locked, cohort),
    {
      onSuccess: () => {
        invalidateCohort(queryClient, cohort, date);
      },
      onError: () => {
        toast.error("Failed to update lock status");
      },
    }
  );
}
