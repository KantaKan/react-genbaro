import type { AttendanceStatusType } from "@/domain/types";

export interface Clock {
  h: number;
  m: number;
}
export interface SessionWindow {
  open_at: Clock;
  late_after: Clock;
  absent_after: Clock;
}
export interface CheckinRules {
  morning: SessionWindow;
  afternoon: SessionWindow;
}
export type SessionName = "morning" | "afternoon";

export interface SessionToday {
  status: AttendanceStatusType;
  checked_in_at: string;
  style?: string;
}

export interface MySummary {
  today: { morning: SessionToday | null; afternoon: SessionToday | null };
  streak: number;
  leave_used: number;
  leave_allowance: number;
  warning_level: "none" | "first" | "second" | "third";
  attendance_rate: number;
  perfect_week: boolean;
  rules: CheckinRules;
  /** false on weekends and holidays */
  class_today: boolean;
  course: { start_date: string; course_days: number; day_number: number; week_number: number; total_weeks: number };
  preferences: { checkin_style: string; checkin_random: boolean };
}
