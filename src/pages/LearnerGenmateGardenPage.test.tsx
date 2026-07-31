import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LearnerGenmateGardenPage from "./LearnerGenmateGardenPage";
import { calculateStreakData } from "@/hooks/use-streak-calculation";
import type { Reflection } from "@/hooks/use-reflections";
import type { GenmateGardenMember } from "@/domain/types";

vi.mock("@/lib/api", () => ({
  getMyGenmateGarden: vi.fn(),
}));

import { getMyGenmateGarden } from "@/lib/api";
const mockedGetGarden = vi.mocked(getMyGenmateGarden);

function localDayString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function makeReflectionDates(count: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(localDayString(d));
  }
  return dates;
}

function makeMembers() {
  const alice: GenmateGardenMember = {
    _id: "user-1",
    first_name: "Alice",
    last_name: "Smith",
    cohort_number: 12,
    genmate_group: "Garden Alpha",
    reflection_dates: makeReflectionDates(5),
  };
  const bob: GenmateGardenMember = {
    _id: "user-2",
    first_name: "Bob",
    last_name: "Johnson",
    cohort_number: 12,
    genmate_group: "Garden Alpha",
    reflection_dates: [],
  };
  const carol: GenmateGardenMember = {
    _id: "user-3",
    first_name: "Carol",
    last_name: "Lee",
    cohort_number: 12,
    genmate_group: "Garden Alpha",
    reflection_dates: [],
  };
  return { alice, bob, carol };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <LearnerGenmateGardenPage />
    </QueryClientProvider>
  );
}

describe("LearnerGenmateGardenPage", () => {
  beforeEach(() => {
    mockedGetGarden.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the learner's own genmate group with member plants", async () => {
    const { alice, bob, carol } = makeMembers();
    mockedGetGarden.mockResolvedValue([alice, bob, carol] as never);

    renderPage();

    expect(await screen.findByText("Garden Alpha")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Carol")).toBeInTheDocument();

    const aliceReflections: Reflection[] = alice.reflection_dates.map((d) => ({
      _id: `ref-${d}`,
      user_id: "user-1",
      date: `${d}T10:00:00.000Z`,
      day: d,
      createdAt: `${d}T10:00:00.000Z`,
      reflection: {
        barometer: "Comfort Zone",
        tech_sessions: { happy: "hooks", improve: "state" },
        non_tech_sessions: { happy: "sync", improve: "focus" },
      },
    }));
    const aliceStreak = calculateStreakData(aliceReflections);
    const avg = aliceStreak.currentStreak / 3;
    expect(
      screen.getByText(`Garden Alpha · 3 members · avg ${avg.toFixed(1)} days`)
    ).toBeInTheDocument();
  });

  it("shows a dash for members with no reflections", async () => {
    const { alice, bob, carol } = makeMembers();
    mockedGetGarden.mockResolvedValue([alice, bob, carol] as never);

    renderPage();

    expect((await screen.findAllByText("—")).length).toBe(2);
  });

  it("renders the empty state when no genmate group is assigned", async () => {
    mockedGetGarden.mockResolvedValue([] as never);

    renderPage();

    expect(
      await screen.findByText(
        "You don't have a genmate group assigned yet. Once you do, your garden will bloom here!"
      )
    ).toBeInTheDocument();
  });

  it("opens the detail popover with member stats", async () => {
    const { alice, bob, carol } = makeMembers();
    mockedGetGarden.mockResolvedValue([alice, bob, carol] as never);

    renderPage();

    const aliceTile = await screen.findByRole("button", { name: /Alice/ });
    fireEvent.click(aliceTile);

    expect(await screen.findByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Reflections")).toBeInTheDocument();
    expect(screen.getByText("Next milestone")).toBeInTheDocument();
  });
});
