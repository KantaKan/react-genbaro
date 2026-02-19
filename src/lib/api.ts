import axios, { AxiosError } from "axios";
import type { Todo, CreateTodoInput, UpdateTodoInput, WeeklyReflection, User, CreateReflectionPayload, BarometerData } from "./types";
import Cookies from "js-cookie";

const getAuthToken = () => {
  const fromCookie = Cookies.get("authToken");
  if (fromCookie) return fromCookie;
  return localStorage.getItem("authToken");
};

const setAuthToken = (token: string) => {
  Cookies.set("authToken", token, { sameSite: "Lax" });
  localStorage.setItem("authToken", token);
};

const removeAuthToken = () => {
  Cookies.remove("authToken");
  localStorage.removeItem("authToken");
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:3000/",
  withCredentials: true,
});

export { setAuthToken, removeAuthToken };

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Dynamically add the token to the header for each request
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getReflectionsByWeek = async (): Promise<WeeklyReflection[]> => {
  const response = await api.get<WeeklyReflection[]>("admin/users/reflections/weekly");
  return response.data;
};

interface GetAllUsersResponse {
  status: string;
  message: string;
  data: { limit: number; page: number; total: number; users: User[] };
}

export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get<GetAllUsersResponse>("admin/users");
  return response.data.data.users;
};

export const getCohort = async (cohort: string): Promise<User[]> => {
  const response = await api.get<GetAllUsersResponse>(`admin/users?cohort=${cohort}`);
  return response.data.data.users;
};

export const getUsersByBarometer = async (barometer: string): Promise<User[]> => {
  const response = await api.get<User[]>(`admin/users/barometer/${barometer}`);
  return response.data;
};

// POST reflection API
export const createReflection = async (userId: string, reflectionData: CreateReflectionPayload): Promise<void> => {
  await api.post(`users/${userId}/reflections`, reflectionData);
};

export const getBarometerData = async (timeRange: string, cohort?: string): Promise<BarometerData[]> => {
  let url = `admin/reflections/chartday?timeRange=${timeRange}`;
  if (cohort) {
    url += `&cohort=${cohort}`;
  }
  const response = await api.get<BarometerData[]>(url);
  return response.data;
};

// Define the registration interface
interface RegistrationData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  cohort_number: string;
  jsd_number: string;
}

export const register = async (userData: RegistrationData) => {
  try {
    console.log("Sending registration data:", userData);

    const response = await api.post("/register", userData);

    console.log("Registration response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Registration error details:", {
      data: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
      requestData: userData,
    });
    throw error;
  }
};

export const removeReaction = async (postId: string) => {
  const response = await api.delete(`/board/posts/${postId}/reactions`);
  return response.data.data;
};

export const addReaction = async ({ postId, reaction }: { postId: string; reaction: string }) => {
  const response = await api.post(`/board/posts/${postId}/reactions`, { reaction });
  return response.data.data;
};

export const addCommentReaction = async ({ commentId, reaction }: { commentId: string; reaction: string }) => {
  const response = await api.post(`/board/comments/${commentId}/reactions`, { reaction });
  return response.data.data;
};

export const removeCommentReaction = async (commentId: string) => {
  const response = await api.delete(`/board/comments/${commentId}/reactions`);
  return response.data.data;
};

// Badge API functions
export const awardBadge = async (userId: string, badgeData: any) => {
  const response = await api.post(`/admin/users/${userId}/badges`, badgeData);
  return response.data;
};

// Attendance API functions

export interface AttendanceCode {
  _id: string;
  code: string;
  cohort_number: number;
  session: "morning" | "afternoon";
  generated_at: string;
  expires_at: string;
  is_active: boolean;
  generated_by: string;
}

export interface AttendanceRecord {
  _id: string;
  user_id: string;
  jsd_number: string;
  first_name: string;
  last_name: string;
  cohort_number: number;
  date: string;
  session: "morning" | "afternoon";
  status: "present" | "late" | "absent" | "late_excused" | "absent_excused";
  marked_by: "self" | "admin";
  submitted_at: string;
  ip_address?: string;
  deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
}

export interface AttendanceStats {
  user_id: string;
  jsd_number: string;
  first_name: string;
  last_name: string;
  cohort_number: number;
  present: number;
  late: number;
  absent: number;
  late_excused: number;
  absent_excused: number;
  total_days: number;
  warning_level: "normal" | "yellow" | "red";
}

export interface TodayOverview {
  session: "morning" | "afternoon";
  code?: string;
  expires_at?: string;
  submitted_count: number;
  students: {
    user_id: string;
    jsd_number: string;
    first_name: string;
    last_name: string;
    morning: string;
    afternoon: string;
    morning_record_id?: string;
    afternoon_record_id?: string;
  }[];
}

export interface AttendanceStatus {
  present: number;
  late: number;
  absent: number;
  late_excused: number;
  absent_excused: number;
  total_days: number;
  warning_level: "normal" | "yellow" | "red";
}

export const generateAttendanceCode = async (cohort: number, session: "morning" | "afternoon"): Promise<AttendanceCode> => {
  const response = await api.post("/admin/attendance/generate-code", { cohort, session });
  return response.data.data;
};

export const getActiveAttendanceCode = async (cohort: number, session: "morning" | "afternoon"): Promise<AttendanceCode | null> => {
  const response = await api.get(`/attendance/code?cohort=${cohort}&session=${session}`);
  return response.data.data;
};

export const submitAttendance = async (code: string, cohort: number): Promise<AttendanceRecord> => {
  const response = await api.post("/attendance/submit", { code, cohort });
  return response.data.data;
};

export const getMyAttendanceStatus = async (): Promise<AttendanceStatus> => {
  const response = await api.get("/attendance/my-status");
  return response.data.data;
};

export const manualMarkAttendance = async (
  userId: string,
  date: string,
  session: "morning" | "afternoon",
  status: "present" | "late" | "absent" | "late_excused" | "absent_excused"
): Promise<AttendanceRecord> => {
  const response = await api.post("/admin/attendance/manual", {
    user_id: userId,
    date,
    session,
    status,
  });
  return response.data.data;
};

export const getAttendanceLogs = async (cohort?: number, date?: string, page = 1, limit = 50) => {
  let url = `/admin/attendance/logs?page=${page}&limit=${limit}`;
  if (cohort) url += `&cohort=${cohort}`;
  if (date) url += `&date=${date}`;
  const response = await api.get(url);
  return response.data.data;
};

export const getAttendanceStats = async (cohort?: number): Promise<AttendanceStats[]> => {
  const url = cohort ? `/admin/attendance/stats?cohort=${cohort}` : "/admin/attendance/stats";
  const response = await api.get(url);
  return response.data.data;
};

export const getStudentAttendanceHistory = async (userId: string): Promise<AttendanceRecord[]> => {
  const response = await api.get(`/admin/attendance/student/${userId}`);
  return response.data.data;
};

export const getTodayOverview = async (cohort: number, session?: "morning" | "afternoon", date?: string): Promise<TodayOverview> => {
  let url = `/admin/attendance/today?cohort=${cohort}`;
  if (session) url += `&session=${session}`;
  if (date) url += `&date=${date}`;
  const response = await api.get(url);
  return response.data.data;
};

export const lockAttendance = async (date: string, session: "morning" | "afternoon", locked: boolean) => {
  const response = await api.post("/admin/attendance/lock", { date, session, locked });
  return response.data;
};

export const deleteAttendanceRecord = async (recordId: string): Promise<AttendanceRecord> => {
  const response = await api.delete(`/admin/attendance/${recordId}`);
  return response.data.data;
};

export const getAttendanceStatsByDays = async (cohort?: number, days = 7): Promise<AttendanceStats[]> => {
  let url = `/admin/attendance/stats-by-days?days=${days}`;
  if (cohort) url += `&cohort=${cohort}`;
  const response = await api.get(url);
  return response.data.data;
};

export interface DailyStats {
  date: string;
  present: number;
  late: number;
  absent: number;
  late_excused: number;
  absent_excused: number;
  total: number;
}

export const getDailyAttendanceStats = async (
  cohort?: number,
  startDate?: string,
  endDate?: string
): Promise<DailyStats[]> => {
  let url = `/admin/attendance/daily-stats?`;
  const queryParams = new URLSearchParams();
  if (cohort) queryParams.append("cohort", cohort.toString());
  if (startDate) queryParams.append("start_date", startDate);
  if (endDate) queryParams.append("end_date", endDate);
  if (queryParams.toString()) url += queryParams.toString();
  const response = await api.get(url);
  return response.data.data;
};

export interface LeaveRequest {
  _id: string;
  user_id: string;
  jsd_number: string;
  first_name: string;
  last_name: string;
  cohort_number: number;
  type: "late" | "half_day" | "full_day";
  session?: "morning" | "afternoon";
  date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  created_by?: string;
  is_manual_entry?: boolean;
}

export interface CreateLeaveRequestPayload {
  type: "late" | "half_day" | "full_day";
  date: string;
  session?: "morning" | "afternoon";
  reason: string;
}

export interface AdminCreateLeaveRequestPayload extends CreateLeaveRequestPayload {
  user_id: string;
}

export const submitLeaveRequest = async (payload: CreateLeaveRequestPayload): Promise<LeaveRequest> => {
  const response = await api.post("/leave-requests", payload);
  return response.data.data;
};

export const getMyLeaveRequests = async (): Promise<LeaveRequest[]> => {
  const response = await api.get("/leave-requests/my");
  return response.data.data;
};

export const getAllLeaveRequests = async (params?: {
  cohort?: number;
  status?: string;
  from_date?: string;
  to_date?: string;
}): Promise<LeaveRequest[]> => {
  let url = "/admin/leave-requests";
  const queryParams = new URLSearchParams();
  if (params?.cohort) queryParams.append("cohort", params.cohort.toString());
  if (params?.status) queryParams.append("status", params.status);
  if (params?.from_date) queryParams.append("from_date", params.from_date);
  if (params?.to_date) queryParams.append("to_date", params.to_date);
  if (queryParams.toString()) url += `?${queryParams.toString()}`;
  const response = await api.get(url);
  return response.data.data;
};

export const adminCreateLeaveRequest = async (payload: AdminCreateLeaveRequestPayload): Promise<LeaveRequest> => {
  const response = await api.post("/admin/leave-requests", payload);
  return response.data.data;
};

export const updateLeaveRequestStatus = async (
  requestId: string,
  status: "approved" | "rejected",
  review_notes?: string
): Promise<LeaveRequest> => {
  const response = await api.patch(`/admin/leave-requests/${requestId}`, { status, review_notes });
  return response.data.data;
};

export const getMyAttendanceHistory = async (days?: number): Promise<AttendanceRecord[]> => {
  let url = "/attendance/my-history";
  if (days) url += `?days=${days}`;
  const response = await api.get(url);
  return response.data.data;
};

export const getMyDailyStats = async (days?: number): Promise<DailyStats[]> => {
  let url = "/attendance/my-daily-stats";
  if (days) url += `?days=${days}`;
  const response = await api.get(url);
  return response.data.data;
};

export const bulkMarkAttendance = async (
  userIds: string[],
  date: string,
  session: "morning" | "afternoon",
  status: "present" | "late" | "absent" | "late_excused" | "absent_excused"
): Promise<{ marked_count: number; records: AttendanceRecord[] }> => {
  const response = await api.post("/admin/attendance/bulk", {
    user_ids: userIds,
    date,
    session,
    status,
  });
  return response.data.data;
};

export interface Holiday {
  _id: string;
  name: string;
  start_date: string;
  end_date: string;
  description?: string;
  created_at: string;
  created_by: string;
}

export const getHolidays = async (startDate?: string, endDate?: string): Promise<Holiday[]> => {
  let url = "/admin/holidays";
  if (startDate && endDate) {
    url += `?start_date=${startDate}&end_date=${endDate}`;
  }
  const response = await api.get(url);
  return response.data.data || [];
};

export const createHoliday = async (
  name: string,
  startDate: string,
  endDate: string,
  description?: string
): Promise<Holiday> => {
  const response = await api.post("/admin/holidays", {
    name,
    start_date: startDate,
    end_date: endDate,
    description,
  });
  return response.data.data;
};

export const deleteHoliday = async (holidayId: string): Promise<void> => {
  await api.delete(`/admin/holidays/${holidayId}`);
};
