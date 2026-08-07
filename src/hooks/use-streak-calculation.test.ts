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
