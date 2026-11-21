import { api } from "@/infrastructure/api";
import type { AttendanceRecord, CreateLeaveRequestPayload, LeaveRequest, Reflection } from "@/domain/types";
import type { MySummary } from "./types";
import type { AvatarConfig } from "./avatar/types";
import type { Person } from "./lib/people";

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
  /** The learner's own reflections (the profile endpoint leaves them out). */
  getMyReflections: (userId: string) => call<Reflection[]>(api.get(`/users/${userId}/reflections`)),
  /** Everyone in my cohort (the users endpoint pages at 50 by default). */
  getCohortPeople: () => call<{ users: Person[] }>(api.get("/users?limit=1000")).then((d) => d.users ?? []),
  getMyLeaves: () => call<LeaveRequest[]>(api.get("/leave-requests/my")),
  requestLeave: (p: CreateLeaveRequestPayload) => call<LeaveRequest>(api.post("/leave-requests", p)),
  savePreferences: (p: Partial<{ checkin_style: string; checkin_random: boolean; avatar: AvatarConfig; skills: string[] }>) =>
    call<Record<string, unknown>>(api.put("/users/me/preferences", p)),
};
