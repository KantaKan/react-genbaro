import type { User, UserData, AttendanceRecord, LeaveRequest, Holiday, Badge } from "../../domain/types";

export const mockUser: User = {
  _id: "user-123",
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  cohort_number: 1,
  jsd_number: "JSD001",
  role: "learner",
  project_group: "Group A",
  genmate_group: "Genmate 1",
  zoom_name: "John Doe",
};

export const mockUserData: UserData = {
  ...mockUser,
  reflections: [],
  badges: [],
};

export const mockAdminUser: User = {
  ...mockUser,
  _id: "admin-123",
  role: "admin",
};

export const mockAttendanceRecord: AttendanceRecord = {
  _id: "attendance-1",
  user_id: "user-123",
  jsd_number: "JSD001",
  first_name: "John",
  last_name: "Doe",
  cohort_number: 1,
  date: "2024-01-15",
  session: "morning",
  status: "present",
  marked_by: "self",
  submitted_at: "2024-01-15T08:00:00Z",
};

export const mockLeaveRequest: LeaveRequest = {
  _id: "leave-1",
  user_id: "user-123",
  jsd_number: "JSD001",
  first_name: "John",
  last_name: "Doe",
  cohort_number: 1,
  type: "full_day",
  date: "2024-01-20",
  reason: "Doctor appointment",
  status: "pending",
  created_at: "2024-01-15T10:00:00Z",
};

export const mockHoliday: Holiday = {
  _id: "holiday-1",
  name: "New Year",
  start_date: "2024-01-01",
  end_date: "2024-01-01",
  description: "New Year Day",
  created_at: "2023-12-01T00:00:00Z",
  created_by: "admin-123",
};

export const mockBadge: Badge = {
  _id: "badge-1",
  type: "achievement",
  name: "Perfect Attendance",
  emoji: "🏆",
  color: "#FFD700",
  style: "pixel",
  awardedAt: "2024-01-15T00:00:00Z",
};

export const mockTokens = {
  token: "mock-jwt-token",
  userId: "user-123",
  role: "learner" as const,
};
