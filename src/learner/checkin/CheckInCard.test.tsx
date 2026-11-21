import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CheckInCard } from "./CheckInCard";
import type { MySummary } from "../types";
import { learnerApi, LearnerApiError } from "../api";

vi.mock("./styles/registry", async (orig) => {
  const real = await orig<typeof import("./styles/registry")>();
  return { ...real, STYLES: real.STYLES.map((m) => (m.id === "alarm" ? { ...m, load: () => Promise.reject(new Error("chunk failed")) } : m)) };
});
vi.mock("../api", async (orig) => {
  const real = await orig<typeof import("../api")>();
  return { ...real, learnerApi: { ...real.learnerApi, checkIn: vi.fn() } };
});

const summary = (over: Partial<MySummary> = {}): MySummary => ({
  today: { morning: null, afternoon: null },
  streak: 12,
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
  ...over,
});

// Bangkok = UTC+7
const setBkk = (h: number, m: number, s = 0) => vi.setSystemTime(new Date(Date.UTC(2026, 8, 8, h - 7, m, s)));
const renderCard = (sum = summary(), onCheckedIn = vi.fn()) =>
  render(
    <MemoryRouter>
      <CheckInCard summary={sum} onCheckedIn={onCheckedIn} />
    </MemoryRouter>
  );

describe("CheckInCard", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    vi.mocked(learnerApi.checkIn).mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("before opening shows when it opens and no control", () => {
    setBkk(8, 0);
    renderCard();
    expect(screen.getByText("Opens at 8:30")).toBeInTheDocument();
    expect(screen.queryByRole("slider")).toBeNull();
  });

  it("on time shows minutes left", () => {
    setBkk(9, 8);
    renderCard();
    expect(screen.getByText("You're on time")).toBeInTheDocument();
    expect(screen.getByText(/7 min until 9:15/)).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("switches to late without a reload", () => {
    setBkk(9, 14, 50);
    renderCard();
    expect(screen.getByText("You're on time")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getByText("Running late? Still check in")).toBeInTheDocument();
  });

  it("after closing offers a leave request", () => {
    setBkk(10, 40);
    renderCard();
    expect(screen.getByText("Check-in closed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request leave" })).toHaveAttribute("href", "/learner/attendance?leave=1");
  });

  it("shows the done state from the summary", () => {
    setBkk(9, 30);
    renderCard(summary({ today: { morning: { status: "present", checked_in_at: "2026-09-08T02:05:00Z" }, afternoon: null } }));
    expect(screen.getByText("You're in · 9:05")).toBeInTheDocument();
    expect(screen.queryByRole("slider")).toBeNull();
  });

  it("a double tap only checks in once", async () => {
    setBkk(9, 8);
    vi.mocked(learnerApi.checkIn).mockReturnValue(new Promise(() => {}));
    renderCard();
    const knob = screen.getByRole("slider");
    fireEvent.keyDown(knob, { key: "Enter" });
    fireEvent.keyDown(knob, { key: "Enter" });
    expect(learnerApi.checkIn).toHaveBeenCalledTimes(1);
  });

  it("shows the server's message when the check-in is rejected", async () => {
    setBkk(9, 8);
    vi.mocked(learnerApi.checkIn).mockRejectedValue(new LearnerApiError(422, "Check-in is closed for this session."));
    renderCard();
    await act(async () => {
      fireEvent.keyDown(screen.getByRole("slider"), { key: "Enter" });
    });
    expect(screen.getByText("Check-in is closed for this session.")).toBeInTheDocument();
    expect(screen.queryByText(/You're in/)).toBeNull();
  });

  it("an 'already checked in' answer refreshes instead of showing an error", async () => {
    setBkk(9, 8);
    vi.mocked(learnerApi.checkIn).mockRejectedValue(new LearnerApiError(409, "You already checked in for this session."));
    const onCheckedIn = vi.fn();
    renderCard(summary(), onCheckedIn);
    await act(async () => {
      fireEvent.keyDown(screen.getByRole("slider"), { key: "Enter" });
    });
    expect(onCheckedIn).toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("an auto-marked absence says absent, not 'You're in'", () => {
    setBkk(10, 40);
    renderCard(summary({ today: { morning: { status: "absent", checked_in_at: "2026-09-08T03:30:00Z" }, afternoon: null } }));
    expect(screen.queryByText(/You're in/)).toBeNull();
    expect(screen.getByText("Marked absent this morning")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request leave" })).toBeInTheDocument();
  });

  it("an excused session says excused", () => {
    setBkk(10, 40);
    renderCard(summary({ today: { morning: { status: "absent_excused", checked_in_at: "2026-09-08T03:30:00Z" }, afternoon: null } }));
    expect(screen.getByText("Excused this morning")).toBeInTheDocument();
  });

  it("a morning check-in doesn't hide the afternoon slider", async () => {
    setBkk(9, 5);
    vi.useFakeTimers({ shouldAdvanceTime: false });
    setBkk(9, 5);
    vi.mocked(learnerApi.checkIn).mockResolvedValue({ status: "present", submitted_at: "2026-09-08T02:05:00Z" } as never);
    renderCard();
    await act(async () => {
      fireEvent.keyDown(screen.getByRole("slider"), { key: "Enter" });
    });
    expect(screen.getByText("You're in · 9:05")).toBeInTheDocument();
    setBkk(13, 0);
    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(screen.getByText("Afternoon check-in")).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("shows the leave message when approved leave covers the session", async () => {
    setBkk(9, 8);
    vi.mocked(learnerApi.checkIn).mockRejectedValue(new LearnerApiError(409, "You have approved leave for this session, so there's nothing to check in."));
    renderCard();
    await act(async () => {
      fireEvent.keyDown(screen.getByRole("slider"), { key: "Enter" });
    });
    expect(screen.getByText(/approved leave for this session/)).toBeInTheDocument();
  });

  it("shows no check-in on a day without class", () => {
    setBkk(9, 8);
    renderCard(summary({ class_today: false }));
    expect(screen.getByText("No class today")).toBeInTheDocument();
    expect(screen.queryByRole("slider")).toBeNull();
  });

  it("has a screen-reader friendly check-in button", async () => {
    setBkk(9, 8);
    vi.mocked(learnerApi.checkIn).mockReturnValue(new Promise(() => {}));
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: "Check in now" }));
    expect(learnerApi.checkIn).toHaveBeenCalledTimes(1);
  });

  it("shows the chosen style in the chip", async () => {
    setBkk(9, 8);
    renderCard(summary({ preferences: { checkin_style: "hold", checkin_random: false } }));
    expect(screen.getByRole("button", { name: /Style · Hold/ })).toBeInTheDocument();
  });

  it("falls back to Slide when the saved style is locked", () => {
    setBkk(9, 8);
    renderCard(summary({ streak: 3, preferences: { checkin_style: "rocket", checkin_random: false } }));
    expect(screen.getByRole("button", { name: /Style · Slide/ })).toBeInTheDocument();
  });

  it("still offers a way to check in when a style fails to load", async () => {
    vi.useRealTimers();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setBkk(9, 8);
    renderCard(summary({ preferences: { checkin_style: "alarm", checkin_random: false } }));
    expect(await screen.findByRole("slider")).toBeInTheDocument();
  });

  it("random mode labels the pick and allows one reroll per day", () => {
    const m = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) });
    setBkk(9, 8);
    renderCard(summary({ preferences: { checkin_style: "", checkin_random: true } }));
    expect(screen.getByRole("button", { name: /Random · / })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reroll" }));
    expect(screen.queryByRole("button", { name: "Reroll" })).toBeNull();
    vi.unstubAllGlobals();
  });
});
