import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { TodayPage } from "./TodayPage";
import { learnerApi } from "../api";
import type { MySummary } from "../types";

vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "learner" }) }));
vi.mock("@/UserDataContext", () => ({
  useUserData: () => ({
    userData: { _id: "u1", first_name: "Aphiradee", zoom_name: "03_Aphiradee(Black/แบล็ค)", cohort_number: 13, reflections: [], badges: [] },
    loading: false,
    refetchUserData: vi.fn(),
  }),
}));
vi.mock("@/hooks/use-reflections", () => ({ useReflections: () => ({ addReflection: vi.fn() }) }));
vi.mock("@/components/linear-feedback-form", () => ({
  default: ({ initialData }: { initialData?: { comfortLevel: string } }) => <div>form:{initialData?.comfortLevel}</div>,
}));
vi.mock("@/application/services/boardService", () => ({ getPosts: vi.fn().mockResolvedValue([]) }));
vi.mock("../api", async (orig) => {
  const real = await orig<typeof import("../api")>();
  return { ...real, learnerApi: { ...real.learnerApi, getSummary: vi.fn(), getHistory: vi.fn().mockResolvedValue([]) } };
});

const base: MySummary = {
  today: { morning: null, afternoon: null },
  streak: 3,
  leave_used: 2,
  leave_allowance: 8,
  warning_level: "none",
  attendance_rate: 0.97,
  perfect_week: false,
  rules: {
    morning: { open_at: { h: 8, m: 30 }, late_after: { h: 9, m: 15 }, absent_after: { h: 10, m: 30 } },
    afternoon: { open_at: { h: 12, m: 30 }, late_after: { h: 13, m: 15 }, absent_after: { h: 14, m: 30 } },
  },
  class_today: true,
  course: { start_date: "", course_days: 75, day_number: 0, week_number: 0, total_weeks: 0 },
  preferences: { checkin_style: "", checkin_random: false },
};

const setBkk = (h: number, m: number) => vi.setSystemTime(new Date(Date.UTC(2026, 8, 8, h - 7, m)));
const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <TodayPage />
      </MemoryRouter>
    </QueryClientProvider>
  );

describe("TodayPage", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("hides course progress when no start date is set", async () => {
    setBkk(10, 0);
    vi.mocked(learnerApi.getSummary).mockResolvedValue(base);
    renderPage();
    expect(await screen.findByText(/Good morning, Black/)).toBeInTheDocument();
    expect(screen.queryByText(/Day \d+ of/)).toBeNull();
  });

  it("shows course progress when known", async () => {
    setBkk(10, 0);
    vi.mocked(learnerApi.getSummary).mockResolvedValue({ ...base, course: { start_date: "2026-06-29", course_days: 75, day_number: 52, week_number: 11, total_weeks: 15 } });
    renderPage();
    expect(await screen.findByText(/Day 52 of 75/)).toBeInTheDocument();
    expect(screen.getByText("Week 11 of 15")).toBeInTheDocument();
  });

  it("keeps the reflection locked before 16:45", async () => {
    setBkk(10, 0);
    vi.mocked(learnerApi.getSummary).mockResolvedValue(base);
    renderPage();
    expect(await screen.findByText(/Opens at 16:45/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Comfort/ })).toBeDisabled();
  });

  it("opens the reflection form with the picked zone after 16:45", async () => {
    setBkk(17, 0);
    vi.mocked(learnerApi.getSummary).mockResolvedValue(base);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Stretch.*enjoying/ }));
    expect(await screen.findByText("form:stretch-enjoying")).toBeInTheDocument();
  });
});
