import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GenmateGarden } from "./genmate-garden";
import { calculateStreakData } from "@/hooks/use-streak-calculation";
import type { Reflection } from "@/hooks/use-reflections";

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn() },
}));

import { api } from "@/lib/api";
const mockedGet = vi.mocked(api.get);

function localDayString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function makeReflection(day: string): Reflection {
  return {
    _id: `ref-${day}`,
    user_id: "user-1",
    date: `${day}T10:00:00.000Z`,
    day,
    createdAt: `${day}T10:00:00.000Z`,
    reflection: {
      barometer: "Comfort Zone",
      tech_sessions: { happy: "hooks", improve: "state" },
      non_tech_sessions: { happy: "sync", improve: "focus" },
    },
  };
}

function makeUsers() {
  const now = new Date();
  const aliceReflections: Reflection[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    aliceReflections.push(makeReflection(localDayString(d)));
  }

  const alice = {
    _id: "user-1",
    first_name: "Alice",
    last_name: "Smith",
    cohort_number: 12,
    genmate_group: "Garden Alpha",
    reflections: aliceReflections,
  };
  const bob = {
    _id: "user-2",
    first_name: "Bob",
    last_name: "Johnson",
    cohort_number: 12,
    genmate_group: "Garden Alpha",
    reflections: [],
  };
  const carol = {
    _id: "user-3",
    first_name: "Carol",
    last_name: "Lee",
    cohort_number: 12,
    genmate_group: "Garden Beta",
    reflections: [],
  };
  return { alice, bob, carol };
}

function renderGarden() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <GenmateGarden cohort="12" />
    </QueryClientProvider>
  );
}

describe("GenmateGarden", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("groups learners by genmate group and shows member plants", async () => {
    const { alice, bob, carol } = makeUsers();
    mockedGet.mockResolvedValue({
      data: { data: { users: [alice, bob, carol] } },
    } as never);

    renderGarden();

    expect(await screen.findByText("Garden Alpha")).toBeInTheDocument();
    expect(screen.getByText("Garden Beta")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Carol")).toBeInTheDocument();

    const aliceStreak = calculateStreakData(alice.reflections);
    const avg = aliceStreak.currentStreak / 2;
    expect(
      screen.getByText(`2 members · avg ${avg.toFixed(1)} days`)
    ).toBeInTheDocument();
  });

  it("shows a dash for members with no reflections", async () => {
    const { alice, bob, carol } = makeUsers();
    mockedGet.mockResolvedValue({
      data: { data: { users: [alice, bob, carol] } },
    } as never);

    renderGarden();

    expect((await screen.findAllByText("—")).length).toBe(2);
  });

  it("renders the empty state when no group is assigned", async () => {
    const { bob } = makeUsers();
    const ungrouped = {
      ...bob,
      _id: "user-9",
      first_name: "No",
      last_name: "Group",
      genmate_group: undefined,
    };
    mockedGet.mockResolvedValue({
      data: { data: { users: [ungrouped] } },
    } as never);

    renderGarden();

    expect(
      await screen.findByText("No learners have a genmate group assigned yet.")
    ).toBeInTheDocument();
  });

  it("opens the detail popover with member stats", async () => {
    const { alice, bob, carol } = makeUsers();
    mockedGet.mockResolvedValue({
      data: { data: { users: [alice, bob, carol] } },
    } as never);

    renderGarden();

    const aliceTile = await screen.findByRole("button", { name: /Alice/ });
    fireEvent.click(aliceTile);

    expect(await screen.findByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Reflections")).toBeInTheDocument();
    expect(screen.getByText("Next milestone")).toBeInTheDocument();
  });
});
