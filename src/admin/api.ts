import { api } from "@/infrastructure/api";
import { leaveService } from "@/application/services/leaveService";
import type { AttendanceStatusType, LeaveRequest } from "@/domain/types/attendance";
import type { PreviousRecord, RegisterView, Session, TodayView, StaffMe, CohortInfo } from "./types";

const data = async <T,>(p: Promise<{ data: { data: T } }>): Promise<T> => (await p).data.data;

export const adminApi = {
  me: () => data<StaffMe>(api.get("/admin/me")),
  cohorts: () => data<CohortInfo[]>(api.get("/admin/cohorts")),
  today: (cohort: number) => data<TodayView>(api.get(`/admin/today?cohort=${cohort}`)),
  register: (cohort: number, week?: string) => data<RegisterView>(api.get(`/admin/attendance/register?cohort=${cohort}${week ? `&week=${week}` : ""}`)),
  /** Marks one session; `previous` is the record it replaced (null if none), for an exact Undo. */
  mark: (p: { user_id: string; date: string; session: Session; status: AttendanceStatusType }) => data<{ record: { _id: string }; previous: PreviousRecord | null }>(api.post("/admin/attendance/mark", p)),
  restore: async (id: string, previous: PreviousRecord) => {
    await api.post(`/admin/attendance/${id}/restore`, previous);
  },
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
