import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { calculateStreakData } from "./use-streak-calculation";
import { isValidWorkday } from "@/utils/date-utils";
import type { Reflection } from "./use-reflections";

// Fixed "today" (a Wednesday) so the test doesn't flip behavior depending on
// what real-world weekday it happens to run on.
const FIXED_TODAY = new Date(2024, 0, 10, 12, 0, 0);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_TODAY);
});

afterEach(() => {
  vi.useRealTimers();
});

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
  } as Reflection;
}

// Walk back from FIXED_TODAY collecting `count` workdays (skipping weekends), oldest first.
function lastNWorkdays(count: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date(FIXED_TODAY);
  cursor.setHours(0, 0, 0, 0);
  while (days.length < count) {
    if (isValidWorkday(cursor)) days.unshift(new Date(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return days;
}

describe("calculateStreakData protected dates", () => {
  it("breaks the streak on an unprotected gap", () => {
    // last 5 workdays, but skip the 2nd-most-recent one (the gap)
    const workdays = lastNWorkdays(5);
    const gapDay = workdays[3];
    const reflections = workdays
      .filter((d) => d.getTime() !== gapDay.getTime())
      .map((d) => makeReflection(localDayString(d)));

    const streakData = calculateStreakData(reflections);

    expect(streakData.eligibleProtectDate).toBe(localDayString(gapDay));
    // streak should only cover the one workday after the gap, not bridge across it
    const daysAfterGap = workdays.filter((d) => d.getTime() > gapDay.getTime()).length;
    expect(streakData.currentStreak).toBe(daysAfterGap);
  });

  it("targets the real gap day, not today, when today isn't submitted yet", () => {
    // last 5 workdays excluding today (not submitted yet) and excluding the gap 2 days back
    const workdays = lastNWorkdays(5);
    const today = workdays[4];
    const gapDay = workdays[2];
    const reflections = workdays
      .filter((d) => d.getTime() !== gapDay.getTime() && d.getTime() !== today.getTime())
      .map((d) => makeReflection(localDayString(d)));

    const streakData = calculateStreakData(reflections);

    expect(streakData.eligibleProtectDate).toBe(localDayString(gapDay));
    expect(streakData.eligibleProtectDate).not.toBe(localDayString(today));
  });

  it("bridges the streak through a protected gap", () => {
    const workdays = lastNWorkdays(5);
    const gapDay = workdays[3];
    const reflections = workdays
      .filter((d) => d.getTime() !== gapDay.getTime())
      .map((d) => makeReflection(localDayString(d)));

    const protectedDates = new Set([localDayString(gapDay)]);
    const streakData = calculateStreakData(reflections, protectedDates);

    expect(streakData.currentStreak).toBe(workdays.length);
    expect(streakData.hasCurrentStreak).toBe(true);
  });
});

describe("resting and comeback streak states", () => {
  it("rests after a missed workday while preserving the previous streak", () => {
    vi.setSystemTime(new Date("2026-10-08T05:00:00Z"));
    const data = calculateStreakData(["2026-10-02", "2026-10-05"].map(makeReflection));

    expect(data.hasCurrentStreak).toBe(false);
    expect(data.currentStreak).toBe(0);
    expect(data.oldStreak).toBe(2);
    expect(data.eligibleProtectDate).toBe("2026-10-06");
  });

  it("keeps Friday's streak active through the weekend and Monday before submission", () => {
    vi.setSystemTime(new Date("2026-10-04T05:00:00Z"));
    const weekend = calculateStreakData([makeReflection("2026-10-02")]);
    expect(weekend.hasCurrentStreak).toBe(true);
    expect(weekend.currentStreak).toBe(1);

    vi.setSystemTime(new Date("2026-10-05T05:00:00Z"));
    const monday = calculateStreakData([makeReflection("2026-10-02")]);
    expect(monday.hasCurrentStreak).toBe(true);
    expect(monday.currentStreak).toBe(1);
  });

  it("uses the Thailand date when UTC is still on Sunday", () => {
    vi.setSystemTime(new Date("2026-10-04T18:30:00Z"));
    const data = calculateStreakData([makeReflection("2026-10-05"), makeReflection("2026-10-02")]);

    expect(data.hasCurrentStreak).toBe(true);
    expect(data.currentStreak).toBe(2);
  });

  it("uses configured holidays and protected dates to bridge a streak", () => {
    vi.setSystemTime(new Date("2026-10-08T05:00:00Z"));
    const data = calculateStreakData(
      ["2026-10-02", "2026-10-06", "2026-10-08"].map(makeReflection),
      new Set(["2026-10-07"]),
      new Set(["2026-10-05"]),
    );

    expect(data.hasCurrentStreak).toBe(true);
    expect(data.currentStreak).toBe(4);
  });

  it("wakes on a new reflection without carrying a broken streak forward", () => {
    vi.setSystemTime(new Date("2026-10-08T05:00:00Z"));
    const data = calculateStreakData(["2026-10-02", "2026-10-05", "2026-10-08"].map(makeReflection));

    expect(data.hasCurrentStreak).toBe(true);
    expect(data.currentStreak).toBe(1);
    expect(data.oldStreak).toBe(2);
    expect(data.bestStreak).toBe(2);
  });

  it("keeps an earlier high-water streak after later shorter returns", () => {
    vi.setSystemTime(new Date("2026-10-15T05:00:00Z"));
    const data = calculateStreakData([
      "2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02",
      "2026-10-06", "2026-10-12", "2026-10-15",
    ].map(makeReflection));

    expect(data.currentStreak).toBe(1);
    expect(data.bestStreak).toBe(5);
  });
});
