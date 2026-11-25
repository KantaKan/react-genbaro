import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { LearnerShell } from "../shell/LearnerShell";
import { CalendarPage } from "./CalendarPage";
import { learnerApi } from "../api";
import type { CalWeek, LearnerCalendar, Session } from "@/calendar/types";

vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "learner" }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "u1", first_name: "A", zoom_name: "03_A(Black/แบล็ค)", cohort_number: 13 }, loading: false }) }));
vi.mock("../api", async (orig) => {
  const real = await orig<typeof import("../api")>();
  return { ...real, learnerApi: { ...real.learnerApi, getCalendar: vi.fn() } };
});

const s = (start: string, end: string, title: string, o: Partial<Session> = {}): Session => ({ start, end, code: "", title, subtitle: "", facilitators: ["Kan"], type: "technical", kind: "session", ...o });
const week2: CalWeek = {
  n: 2,
  name: "WEEK 2",
  monday: "2026-07-06",
  days: [
    { date: "2026-07-06", label: "DAY 6", weekday: 0, holiday: true, sessions: [] },
    {
      date: "2026-07-07",
      label: "DAY 7",
      weekday: 1,
      holiday: false,
      sessions: [
        s("09:00", "09:15", "Daily Opening", { code: "C-DO1", type: "community", facilitators: ["Kan", "Neeti"] }),
        s("09:15", "12:00", "REACT Hooks", { code: "REACT-4", subtitle: "(useEffect)", facilitators: ["Neeti"] }),
        s("12:00", "13:00", "Lunch", { kind: "break", type: "break", facilitators: [] }),
        s("13:00", "15:30", "JS Assessment", { type: "reinforcement", facilitators: ["Kan", "Neeti"] }),
      ],
    },
    { date: "2026-07-08", label: "DAY 8", weekday: 2, holiday: false, sessions: [s("09:15", "12:00", "Build Day", { facilitators: ["Neeti"] })] },
  ],
};
const week1: CalWeek = { n: 1, name: "WEEK 1", monday: "2026-06-29", days: [{ date: "2026-06-29", label: "DAY 1", weekday: 0, holiday: false, sessions: [s("09:00", "10:00", "Welcome to Generation")] }] };
const cal = (o: Partial<LearnerCalendar> = {}): LearnerCalendar => ({ zoom_url: "https://zoom.us/j/999", weeks: [week1, week2], ...o });

const at = (iso: string) => vi.setSystemTime(new Date(iso));
const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={["/learner/calendar"]}>
        <LearnerShell>
          <CalendarPage />
        </LearnerShell>
      </MemoryRouter>
    </QueryClientProvider>
  );

describe("learner CalendarPage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    at("2026-07-07T03:15:00Z"); // Tue 10:15 Bangkok
    vi.mocked(learnerApi.getCalendar).mockReset().mockResolvedValue(cal());
  });
  afterEach(() => vi.useRealTimers());

  it("shows what's on now, how long is left, and a Join Zoom link", async () => {
    renderPage();
    const card = await screen.findByRole("region", { name: "Now and next" });
    expect(within(card).getByText("Now")).toBeInTheDocument();
    expect(within(card).getByText("REACT Hooks")).toBeInTheDocument();
    expect(within(card).getByText(/ends in 1 h 45 min/)).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "Join Zoom" })).toHaveAttribute("href", "https://zoom.us/j/999");
  });

  it("lists today's sessions with times, facilitators and breaks", async () => {
    renderPage();
    const agenda = await screen.findByRole("region", { name: "Agenda" });
    expect(within(agenda).getByText("REACT Hooks")).toBeInTheDocument();
    expect(within(agenda).getByText("09:15")).toBeInTheDocument();
    expect(within(agenda).getByText("Neeti")).toBeInTheDocument();
    expect(within(agenda).getAllByText("Kan · Neeti")).toHaveLength(2);
    expect(within(agenda).getByText("Lunch")).toBeInTheDocument();
    expect(within(agenda).getByText("2 h 45 min")).toBeInTheDocument();
  });

  it("switches day, and says when a day is a holiday", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Wed 8/ }));
    expect(within(screen.getByRole("region", { name: "Agenda" })).getByText("Build Day")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Mon 6/ }));
    expect(within(screen.getByRole("region", { name: "Agenda" })).getByText(/No class this day/)).toBeInTheDocument();
  });

  it("between sessions it shows what's next and when", async () => {
    at("2026-07-07T05:30:00Z"); // 12:30, lunch
    renderPage();
    const card = await screen.findByRole("region", { name: "Now and next" });
    expect(within(card).getByText("Next up")).toBeInTheDocument();
    expect(within(card).getByText("JS Assessment")).toBeInTheDocument();
    expect(within(card).getByText(/in 30 min/)).toBeInTheDocument();
  });

  it("moves between published weeks and can't go past the last one", async () => {
    renderPage();
    await screen.findByText(/Week 2/);
    expect(screen.getByRole("button", { name: "Next week" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    expect(await screen.findByText(/Week 1/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous week" })).toBeDisabled();
    expect(screen.getByText("Welcome to Generation")).toBeInTheDocument();
  });

  it("adds up the week by session type", async () => {
    renderPage();
    const mix = await screen.findByRole("region", { name: "This week" });
    expect(within(mix).getByText("Technical Skills")).toBeInTheDocument();
    expect(within(mix).getByText("5 h 30 min")).toBeInTheDocument();
  });

  it("explains when nothing is published yet (not an error)", async () => {
    vi.mocked(learnerApi.getCalendar).mockResolvedValue(cal({ weeks: [] }));
    renderPage();
    expect(await screen.findByText("Your schedule isn't ready yet")).toBeInTheDocument();
    expect(screen.getByText(/publish/i)).toBeInTheDocument();
  });

  it("can retry when the schedule fails to load", async () => {
    vi.mocked(learnerApi.getCalendar).mockRejectedValueOnce(new Error("boom"));
    renderPage();
    expect(await screen.findByText("Couldn't load your schedule")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(learnerApi.getCalendar).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("region", { name: "Agenda" })).toBeInTheDocument();
  });
});
