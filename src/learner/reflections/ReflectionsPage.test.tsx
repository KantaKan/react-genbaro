import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import type { Reflection } from "@/domain/types";
import { ReflectionsPage } from "./ReflectionsPage";

const addReflection = vi.fn();
vi.mock("@/hooks/use-reflections", () => ({ useReflections: () => ({ addReflection }) }));
vi.mock("@/hooks/use-holiday-dates", () => ({ useHolidayDates: () => new Set<string>() }));
vi.mock("@/UserDataContext", () => ({
  useUserData: () => ({ userData: { _id: "u1", first_name: "Fah", cohort_number: 13 }, loading: false, refetchUserData: vi.fn() }),
}));
vi.mock("@/components/teacher-gift-boxes-dialog", () => ({ TeacherGiftBoxesDialog: () => null }));
vi.mock("@/application/services/giftBoxService", () => ({ giftBoxService: { reconcileMilestones: vi.fn().mockResolvedValue([]) } }));
vi.mock("@/lib/api", () => ({ api: { get: vi.fn().mockResolvedValue({ data: { data: { _id: "u1", growth_points: 0, care_energy_log: [] } } }) } }));

const r = (day: string, barometer: string, happy: string, reply = ""): Reflection => ({
  _id: `r${day.slice(8)}`,
  user_id: "u1",
  date: `${day}T18:00:00+07:00`,
  day,
  reflection: { barometer, tech_sessions: { happy, improve: "improve " + day }, non_tech_sessions: { happy: "soft " + day, improve: "soft improve" } },
  admin_feedback: reply || undefined,
});
let reflections: Reflection[] = [];
vi.mock("../api", async (orig) => {
  const real = await orig<typeof import("../api")>();
  return {
    ...real,
    learnerApi: {
      ...real.learnerApi,
      getMyReflections: vi.fn(() => Promise.resolve(reflections)),
      getSummary: vi.fn().mockResolvedValue({ course: { week_number: 11, total_weeks: 15, day_number: 52, course_days: 75, start_date: "" } }),
    },
  };
});

const setBkk = (day: number, h: number) => vi.setSystemTime(new Date(Date.UTC(2026, 10, day, h - 7, 0)));
const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ReflectionsPage />
      </MemoryRouter>
    </QueryClientProvider>
  );

describe("ReflectionsPage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setBkk(19, 12);
    // Node 26 shadows jsdom's localStorage; use an in-memory one.
    const m = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), clear: () => m.clear() });
    addReflection.mockReset();
    reflections = [
      r("2026-11-16", "Comfort Zone", "Hooks lab went well", "Nice work"),
      r("2026-11-18", "Panic Zone", "Lost on async errors", "Let's pair at 9:30"),
    ];
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("opens on the journal with the newest night open", async () => {
    renderPage();
    expect(await screen.findByText("Lost on async errors")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Journal" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Let's pair at 9:30")).toBeInTheDocument();
    // older night is a closed row: its reply isn't shown until opened
    expect(screen.queryByText("Nice work")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Mon 16.*Hooks lab went well/ }));
    expect(screen.getByText("Nice work")).toBeInTheDocument();
  });

  it("remembers the chosen view and filter next time", async () => {
    const first = renderPage();
    await screen.findByText("Lost on async errors");
    fireEvent.click(screen.getByRole("button", { name: "Calendar" }));
    fireEvent.click(screen.getByRole("button", { name: /Rough nights/ }));
    first.unmount();

    renderPage();
    await screen.findByText("November 2026");
    expect(screen.getByRole("button", { name: "Calendar" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Rough nights/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("filters to rough nights", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Rough nights · 1/ }));
    expect(screen.getByText("Lost on async errors")).toBeInTheDocument();
    expect(screen.queryByText(/Hooks lab went well/)).not.toBeInTheDocument();
  });

  it("calls out a new TA reply and opens it", async () => {
    localStorage.setItem("baro:reflections-seen:u1", JSON.stringify(["r16"]));
    renderPage();
    const card = (await screen.findByText("1 new reply from your TAs")).closest("section")!;
    fireEvent.click(within(card).getByRole("button", { name: "Read reply" }));
    expect(screen.getByText("No new replies")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("baro:reflections-seen:u1")!)).toContain("r18");
  });

  it("does not flag old replies as new on the first visit", async () => {
    renderPage();
    expect(await screen.findByText("No new replies")).toBeInTheDocument();
  });

  it("shows a picked night in the calendar side panel", async () => {
    renderPage();
    await screen.findByText("Lost on async errors");
    fireEvent.click(screen.getByRole("button", { name: "Calendar" }));
    fireEvent.click(screen.getByRole("button", { name: /^16 Nov/ }));
    const panel = screen.getByRole("complementary", { name: "Selected night" });
    expect(within(panel).getByText("Mon 16 Nov")).toBeInTheDocument();
    expect(within(panel).getByText("Nice work")).toBeInTheDocument();
  });

  it("shows this week with the missed night", async () => {
    renderPage();
    const week = (await screen.findByText("This week")).closest("section")!;
    expect(within(week).getByText("Missed")).toBeInTheDocument();
    expect(within(week).getByText("Today")).toBeInTheDocument();
  });

  it("sends tonight's reflection with all four answers", async () => {
    setBkk(19, 18);
    addReflection.mockResolvedValue({ ...r("2026-11-19", "Comfort Zone", "a") });
    renderPage();
    await screen.findByText("Lost on async errors");
    fireEvent.click(screen.getByRole("button", { name: "Comfort zone" }));
    const answers = ["went well", "to improve", "people", "habits"];
    [/Tech · what went well/, /Tech · what to improve/, /Non-tech · what went well/, /Non-tech · what to improve/].forEach((l, i) =>
      fireEvent.change(screen.getByLabelText(l), { target: { value: answers[i] } })
    );
    fireEvent.click(screen.getByRole("button", { name: "Send reflection" }));
    await waitFor(() => expect(addReflection).toHaveBeenCalled());
    expect(addReflection.mock.calls[0][0]).toMatchObject({
      user_id: "u1",
      day: "2026-11-19",
      reflection: {
        barometer: "Comfort Zone",
        tech_sessions: { happy: "went well", improve: "to improve" },
        non_tech_sessions: { happy: "people", improve: "habits" },
      },
    });
  });
});
