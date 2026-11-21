import { api } from "@/infrastructure/api";
import { leaveService } from "@/application/services/leaveService";
import type { AttendanceStatusType, LeaveRequest } from "@/domain/types/attendance";
import type { RegisterView, Session, TodayView } from "./types";

const data = async <T,>(p: Promise<{ data: { data: T } }>): Promise<T> => (await p).data.data;

export const adminApi = {
  today: (cohort: number) => data<TodayView>(api.get(`/admin/today?cohort=${cohort}`)),
  register: (cohort: number, week?: string) => data<RegisterView>(api.get(`/admin/attendance/register?cohort=${cohort}${week ? `&week=${week}` : ""}`)),
  mark: (p: { user_id: string; date: string; session: Session; status: AttendanceStatusType }) => data<{ _id: string }>(api.post("/admin/attendance/manual", p)),
  bulk: async (p: { user_ids: string[]; date: string; session: Session; status: AttendanceStatusType }) => {
    await api.post("/admin/attendance/bulk", p);
  },
  removeRecord: async (id: string) => {
    await api.delete(`/admin/attendance/${id}`);
  },
  leaves: (params: { cohort: number; status?: "pending" | "approved" | "rejected" }): Promise<LeaveRequest[]> => leaveService.getAllLeaveRequests(params),
  reviewLeave: async (id: string, status: "approved" | "rejected", notes?: string) => {
    await leaveService.updateLeaveRequestStatus(id, status, notes);
  },
};
