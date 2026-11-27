import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { LearnerShell } from "../shell/LearnerShell";
import { AttendancePage } from "./AttendancePage";
import { learnerApi } from "../api";
import type { AttendanceRecord } from "@/domain/types";
import type { MySummary } from "../types";

vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "learner" }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/UserDataContext", () => ({
  useUserData: () => ({ userData: { _id: "u1", first_name: "A", zoom_name: "03_A(Black/แบล็ค)", cohort_number: 13 }, loading: false }),
}));
vi.mock("../api", async (orig) => {
  const real = await orig<typeof import("../api")>();
  return {
    ...real,
    learnerApi: { ...real.learnerApi, getMyReflections: vi.fn().mockResolvedValue([]), getSummary: vi.fn(), getHistory: vi.fn(), getMyLeaves: vi.fn(), requestLeave: vi.fn() },
  };
});

const summary = {
  today: { morning: null, afternoon: null },
  streak: 3, leave_used: 2, leave_allowance: 8, warning_level: "none", attendance_rate: 0.971, perfect_week: false,
  rules: {
    morning: { open_at: { h: 8, m: 30 }, late_after: { h: 9, m: 15 }, absent_after: { h: 10, m: 30 } },
    afternoon: { open_at: { h: 12, m: 30 }, late_after: { h: 13, m: 15 }, absent_after: { h: 14, m: 30 } },
  },
  class_today: true,
  course: { start_date: "2026-06-29", course_days: 75, day_number: 52, week_number: 11, total_weeks: 15 },
  preferences: { checkin_style: "", checkin_random: false },
} as MySummary;

const rec = (date: string, session: "morning" | "afternoon", status: AttendanceRecord["status"]) =>
  ({ _id: date + session, date, session, status, submitted_at: `${date}T02:05:00Z` } as AttendanceRecord);

const renderPage = (path = "/learner/attendance") =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <LearnerShell>
          <AttendancePage />
        </LearnerShell>
      </MemoryRouter>
    </QueryClientProvider>
  );

describe("AttendancePage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(Date.UTC(2026, 8, 8, 3, 0)));
    vi.mocked(learnerApi.getSummary).mockResolvedValue(summary);
    vi.mocked(learnerApi.getHistory).mockResolvedValue([rec("2026-09-01", "morning", "present"), rec("2026-09-01", "afternoon", "late")]);
    vi.mocked(learnerApi.getMyLeaves).mockResolvedValue([]);
    vi.mocked(learnerApi.requestLeave).mockReset().mockResolvedValue({} as never);
  });
  afterEach(() => vi.useRealTimers());

  it("puts the title, week and Request leave in the top bar", async () => {
    renderPage();
    const banner = screen.getByRole("banner");
    await waitFor(() => expect(banner).toHaveTextContent("Week 11 of 15"));
    expect(within(banner).getByRole("button", { name: "Request leave" })).toBeInTheDocument();
  });

  it("shows a past day's details when clicked", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /September 1\b/ }));
    const detail = screen.getByTestId("day-detail");
    expect(detail).toHaveTextContent("Morning: Present");
    expect(detail).toHaveTextContent("Afternoon: Late");
  });

  it("offers a leave request for a future day", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /September 10\b/ }));
    expect(within(screen.getByTestId("day-detail")).getByRole("button", { name: "Request leave" })).toBeInTheDocument();
  });

  it("sends one leave request from the sheet", async () => {
    renderPage("/learner/attendance?leave=1");
    const send = await screen.findByRole("button", { name: "Send request" });
    fireEvent.click(send);
    fireEvent.click(send);
    await waitFor(() => expect(learnerApi.requestLeave).toHaveBeenCalledTimes(1));
    expect(vi.mocked(learnerApi.requestLeave).mock.calls[0][0]).toMatchObject({ type: "full_day", reason: "Sickness" });
  });
});
