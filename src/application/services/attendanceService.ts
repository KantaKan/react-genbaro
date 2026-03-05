import { api } from "../../infrastructure/api";
import type {
  AttendanceCode,
  AttendanceRecord,
  AttendanceStats,
  TodayOverview,
  AttendanceStatus,
  DailyStats,
  AttendanceSession,
  AttendanceStatusType,
} from "../../domain/types";

export const attendanceService = {
  async generateAttendanceCode(
    cohort: number,
    session: AttendanceSession
  ): Promise<AttendanceCode> {
    const response = await api.post("/admin/attendance/generate-code", { cohort, session });
    return response.data.data;
  },

  async getActiveAttendanceCode(
    cohort: number,
    session: AttendanceSession
  ): Promise<AttendanceCode | null> {
    const response = await api.get(`/attendance/code?cohort=${cohort}&session=${session}`);
    return response.data.data;
  },

  async submitAttendance(code: string, cohort: number): Promise<AttendanceRecord> {
    const response = await api.post("/attendance/submit", { code, cohort });
    return response.data.data;
  },

  async getMyAttendanceStatus(): Promise<AttendanceStatus> {
    const response = await api.get("/attendance/my-status");
    return response.data.data;
  },

  async manualMarkAttendance(
    userId: string,
    date: string,
    session: AttendanceSession,
    status: AttendanceStatusType
  ): Promise<AttendanceRecord> {
    const response = await api.post("/admin/attendance/manual", {
      user_id: userId,
      date,
      session,
      status,
    });
    return response.data.data;
  },

  async getAttendanceLogs(
    cohort?: number,
    date?: string,
    page = 1,
    limit = 50
  ) {
    let url = `/admin/attendance/logs?page=${page}&limit=${limit}`;
    if (cohort) url += `&cohort=${cohort}`;
    if (date) url += `&date=${date}`;
    const response = await api.get(url);
    return response.data.data;
  },

  async getAttendanceStats(
    cohort?: number,
    startDate?: string,
    endDate?: string
  ): Promise<AttendanceStats[]> {
    const params = new URLSearchParams();
    if (cohort) params.append("cohort", cohort.toString());
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    const url = `/admin/attendance/stats${params.toString() ? "?" + params.toString() : ""}`;
    const response = await api.get(url);
    return response.data.data;
  },

  async getStudentAttendanceHistory(userId: string): Promise<AttendanceRecord[]> {
    const response = await api.get(`/admin/attendance/student/${userId}`);
    return response.data.data;
  },

  async getTodayOverview(
    cohort: number,
    session?: AttendanceSession,
    date?: string
  ): Promise<TodayOverview> {
    let url = `/admin/attendance/today?cohort=${cohort}`;
    if (session) url += `&session=${session}`;
    if (date) url += `&date=${date}`;
    const response = await api.get(url);
    return response.data.data;
  },

  async lockAttendance(
    date: string,
    session: AttendanceSession,
    locked: boolean
  ) {
    const response = await api.post("/admin/attendance/lock", { date, session, locked });
    return response.data;
  },

  async deleteAttendanceRecord(recordId: string): Promise<AttendanceRecord> {
    const response = await api.delete(`/admin/attendance/${recordId}`);
    return response.data.data;
  },

  async getAttendanceStatsByDays(
    cohort?: number,
    days = 7
  ): Promise<AttendanceStats[]> {
    let url = `/admin/attendance/stats-by-days?days=${days}`;
    if (cohort) url += `&cohort=${cohort}`;
    const response = await api.get(url);
    return response.data.data;
  },

  async getDailyAttendanceStats(
    cohort?: number,
    startDate?: string,
    endDate?: string
  ): Promise<DailyStats[]> {
    let url = `/admin/attendance/daily-stats?`;
    const queryParams = new URLSearchParams();
    if (cohort) queryParams.append("cohort", cohort.toString());
    if (startDate) queryParams.append("start_date", startDate);
    if (endDate) queryParams.append("end_date", endDate);
    if (queryParams.toString()) url += queryParams.toString();
    const response = await api.get(url);
    return response.data.data;
  },

  async getMyAttendanceHistory(days?: number): Promise<AttendanceRecord[]> {
    let url = "/attendance/my-history";
    if (days) url += `?days=${days}`;
    const response = await api.get(url);
    return response.data.data;
  },

  async getMyDailyStats(days?: number): Promise<DailyStats[]> {
    let url = "/attendance/my-daily-stats";
    if (days) url += `?days=${days}`;
    const response = await api.get(url);
    return response.data.data;
  },

  async bulkMarkAttendance(
    userIds: string[],
    date: string,
    session: AttendanceSession,
    status: AttendanceStatusType
  ): Promise<{ marked_count: number; records: AttendanceRecord[] }> {
    const response = await api.post("/admin/attendance/bulk", {
      user_ids: userIds,
      date,
      session,
      status,
    });
    return response.data.data;
  },

  async exportSalesforceCSV(
    cohort: number,
    startDate: string,
    endDate: string
  ): Promise<Blob> {
    const params = new URLSearchParams({
      cohort: cohort.toString(),
      start_date: startDate,
      end_date: endDate,
    });
    const response = await api.get(
      `/admin/attendance/export/salesforce?${params.toString()}`,
      { responseType: "blob" }
    );
    return response.data;
  },

  async updateSalesforceID(userId: string, salesforceId: string): Promise<void> {
    await api.patch(`/admin/users/${userId}/salesforce-id`, {
      salesforce_id: salesforceId,
    });
  },
};

export const generateAttendanceCode = attendanceService.generateAttendanceCode;
export const getActiveAttendanceCode = attendanceService.getActiveAttendanceCode;
export const submitAttendance = attendanceService.submitAttendance;
export const getMyAttendanceStatus = attendanceService.getMyAttendanceStatus;
export const manualMarkAttendance = attendanceService.manualMarkAttendance;
export const getAttendanceLogs = attendanceService.getAttendanceLogs;
export const getAttendanceStats = attendanceService.getAttendanceStats;
export const getStudentAttendanceHistory = attendanceService.getStudentAttendanceHistory;
export const getTodayOverview = attendanceService.getTodayOverview;
export const lockAttendance = attendanceService.lockAttendance;
export const deleteAttendanceRecord = attendanceService.deleteAttendanceRecord;
export const getAttendanceStatsByDays = attendanceService.getAttendanceStatsByDays;
export const getDailyAttendanceStats = attendanceService.getDailyAttendanceStats;
export const getMyAttendanceHistory = attendanceService.getMyAttendanceHistory;
export const getMyDailyStats = attendanceService.getMyDailyStats;
export const bulkMarkAttendance = attendanceService.bulkMarkAttendance;
export const exportSalesforceCSV = attendanceService.exportSalesforceCSV;
export const updateSalesforceID = attendanceService.updateSalesforceID;

export default attendanceService;
