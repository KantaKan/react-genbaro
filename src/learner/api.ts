import { api } from "@/infrastructure/api";
import type { AttendanceRecord, CreateLeaveRequestPayload, LeaveRequest } from "@/domain/types";
import type { MySummary } from "./types";

export class LearnerApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  try {
    return (await p).data.data;
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: { message?: string; error?: string } } };
    const status = err.response?.status ?? 0;
    const msg = err.response?.data?.message || err.response?.data?.error || "Something went wrong. Please try again.";
    throw new LearnerApiError(status, msg);
  }
}

export const learnerApi = {
  getSummary: () => call<MySummary>(api.get("/attendance/me/summary")),
  checkIn: (style: string) => call<AttendanceRecord>(api.post("/attendance/check-in", { style })),
  getHistory: (days?: number) => call<AttendanceRecord[]>(api.get(`/attendance/my-history${days ? `?days=${days}` : ""}`)),
  getMyLeaves: () => call<LeaveRequest[]>(api.get("/leave-requests/my")),
  requestLeave: (p: CreateLeaveRequestPayload) => call<LeaveRequest>(api.post("/leave-requests", p)),
  savePreferences: (p: Partial<{ checkin_style: string; checkin_random: boolean }>) =>
    call<Record<string, unknown>>(api.put("/users/me/preferences", p)),
};
