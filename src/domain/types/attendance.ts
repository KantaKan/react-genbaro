export type AttendanceSession = "morning" | "afternoon";
export type AttendanceStatusType = "present" | "late" | "absent" | "late_excused" | "absent_excused";
export type WarningLevel = "normal" | "yellow" | "red";

export interface AttendanceCode {
  _id: string;
  code: string;
  cohort_number: number;
  session: AttendanceSession;
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
  session: AttendanceSession;
  status: AttendanceStatusType;
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
  present_days: number;
  absent_days: number;
  warning_level: WarningLevel;
}

export interface TodayOverview {
  session: AttendanceSession;
  code?: string;
  expires_at?: string;
  submitted_count: number;
  students: TodayStudent[];
}

export interface TodayStudent {
  user_id: string;
  jsd_number: string;
  first_name: string;
  last_name: string;
  morning: string;
  afternoon: string;
  morning_record_id?: string;
  afternoon_record_id?: string;
}

export interface AttendanceStatus {
  present: number;
  late: number;
  absent: number;
  late_excused: number;
  absent_excused: number;
  warning_level: WarningLevel;
}

export interface DailyStats {
  date: string;
  present: number;
  late: number;
  absent: number;
  late_excused: number;
  absent_excused: number;
  total: number;
}

export interface LeaveRequest {
  _id: string;
  user_id: string;
  jsd_number: string;
  first_name: string;
  last_name: string;
  cohort_number: number;
  type: "late" | "half_day" | "full_day";
  session?: AttendanceSession;
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
  session?: AttendanceSession;
  reason: string;
}

export interface AdminCreateLeaveRequestPayload extends CreateLeaveRequestPayload {
  user_id: string;
}

export interface Holiday {
  _id: string;
  name: string;
  start_date: string;
  end_date: string;
  description?: string;
  created_at: string;
  created_by: string;
}
