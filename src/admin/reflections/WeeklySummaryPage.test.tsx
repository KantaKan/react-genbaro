import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import { renderAdmin } from "../test-setup";
import { WeeklySummaryPage } from "./WeeklySummaryPage";
import { wellbeingApi, type WeekRough } from "../wellbeing";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", cohort_number: 13 }, loading: false }) }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]), me: vi.fn().mockRejectedValue(new Error("x")), cohorts: vi.fn().mockRejectedValue(new Error("x")) } }));
vi.mock("../wellbeing", async (o) => ({ ...(await o<object>()), wellbeingApi: { support: vi.fn().mockResolvedValue([]), weeks: vi.fn() } }));

const ref = (id: string, en: string, th: string) => ({ id, first_name: en, zoom_name: `01_${en}(${en}/${th})`, jsd_number: "01", genmate_group: "B" });
const weeks: WeekRough[] = [
  {
    week: "2026-11-16",
    sent: 13,
    possible: 16,
    zones: { comfort: 6, "stretch-enjoying": 3, "stretch-overwhelmed": 3, panic: 2 },
    learners: [
      { learner: ref("a", "Mint", "มิ้นท์"), nights: ["panic", "panic", "stretch-overwhelmed", "", ""], panic: 2, overwhelmed: 1, again: false },
      { learner: ref("b", "Fah", "ฟ้า"), nights: ["", "", "", "stretch-overwhelmed", ""], panic: 0, overwhelmed: 1, again: true },
    ],
  },
  { week: "2026-11-09", sent: 20, possible: 20, zones: { comfort: 14, "stretch-enjoying": 6, "stretch-overwhelmed": 0, panic: 0 }, learners: [] },
];

describe("WeeklySummaryPage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-20T09:00:00Z"));
    vi.mocked(wellbeingApi.weeks).mockReset().mockResolvedValue(weeks);
  });
  afterEach(() => vi.useRealTimers());

  it("shows each week with how it felt and who had rough nights", async () => {
    renderAdmin(<WeeklySummaryPage />, "/admin/weekly-summary");
    const w = await screen.findByRole("region", { name: "Week of 16–20 Nov" });
    expect(wellbeingApi.weeks).toHaveBeenCalledWith(13, 6);
    expect(within(w).getByText("This week")).toBeInTheDocument();
    expect(within(w).getByText("81% sent")).toBeInTheDocument();
    expect(within(w).getByText("5 rough nights · 2 learners")).toBeInTheDocument();
    expect(within(w).getByText("2 panic · 1 overwhelmed")).toBeInTheDocument();
    expect(within(w).getByRole("img", { name: "Mon panic, Tue panic, Wed overwhelmed, Thu not written, Fri not written" })).toBeInTheDocument();
    expect(within(w).getByText("Again")).toBeInTheDocument();
    expect(within(w).getByRole("link", { name: /มิ้นท์/ })).toHaveAttribute("href", "/admin/learners/a");
  });

  it("says so when nobody had a rough week", async () => {
    renderAdmin(<WeeklySummaryPage />, "/admin/weekly-summary");
    const w = await screen.findByRole("region", { name: "Week of 9–13 Nov" });
    expect(within(w).getByText("Nobody had a rough night this week.")).toBeInTheDocument();
  });

  it("can show panic only", async () => {
    renderAdmin(<WeeklySummaryPage />, "/admin/weekly-summary");
    const w = await screen.findByRole("region", { name: "Week of 16–20 Nov" });
    fireEvent.click(screen.getByRole("button", { name: "Panic only" }));
    expect(within(w).queryByText("ฟ้า")).toBeNull();
    expect(within(w).getByText("มิ้นท์")).toBeInTheDocument();
  });

  it("loads more weeks", async () => {
    renderAdmin(<WeeklySummaryPage />, "/admin/weekly-summary");
    await screen.findByRole("region", { name: "Week of 16–20 Nov" });
    fireEvent.click(screen.getByRole("button", { name: "Show earlier weeks" }));
    await waitFor(() => expect(wellbeingApi.weeks).toHaveBeenLastCalledWith(13, 12));
  });
});
