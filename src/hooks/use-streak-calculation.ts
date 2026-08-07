import { useMemo } from "react";
import type { Reflection, StreakData } from "./use-reflections";
import { isHoliday, isProtectedDate, isWeekend, getPreviousWorkday, toLocalDateKey } from "../utils/date-utils";

// ponytail: 7-day lookback window is a placeholder product number, move to a config constant if it needs tuning
const PROTECT_LOOKBACK_DAYS = 7;

function withinLookback(date: Date, today: Date): boolean {
  const diffDays = (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= PROTECT_LOOKBACK_DAYS;
}

export function calculateStreakData(reflections: Reflection[], protectedDates: Set<string> = new Set()): StreakData {
  if (reflections.length === 0) {
    return {
      currentStreak: 0,
      oldStreak: 0,
      lastActiveDate: null,
      hasCurrentStreak: false,
      eligibleProtectDate: null,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Use the 'day' field for date comparison since it's more reliable
  const sortedDates = reflections.map((r) => new Date(r.day || r.date)).sort((a, b) => b.getTime() - a.getTime());

  let currentStreak = 0;
  let oldStreak = 0;
  let lastActiveDate: Date | null = null;
  let hasCurrentStreak = false;
  let streakBroken = false;
  let eligibleGapDate: Date | null = null;

  const hasTodayReflection = sortedDates.some((date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  let currentDate = new Date(today);
  if (isWeekend(today)) {
    while (isWeekend(currentDate)) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    const hasLastWorkdayReflection = sortedDates.some((date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === currentDate.getTime();
    });

    if (hasLastWorkdayReflection) {
      hasCurrentStreak = true;
    }
  } else {
    hasCurrentStreak = hasTodayReflection;
  }

  currentDate = isWeekend(today) ? getPreviousWorkday(today) : today;

  if (hasCurrentStreak) {
    if (hasTodayReflection && !isWeekend(today)) {
      currentStreak = 1;
      lastActiveDate = new Date(today);
    }

    let checkDate = getPreviousWorkday(currentDate);

    while (true) {
      if (isWeekend(checkDate)) {
        checkDate = getPreviousWorkday(checkDate);
        continue;
      }

      const hasReflectionOnDate =
        sortedDates.some((date) => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === checkDate.getTime();
        }) || isHoliday(checkDate) || isProtectedDate(checkDate, protectedDates);

      if (hasReflectionOnDate) {
        currentStreak++;
        if (!lastActiveDate) lastActiveDate = new Date(checkDate);
        checkDate = getPreviousWorkday(checkDate);
      } else {
        streakBroken = true;
        eligibleGapDate = new Date(checkDate);
        break;
      }
    }

    if (streakBroken) {
      checkDate = getPreviousWorkday(checkDate);

      while (true) {
        if (isWeekend(checkDate)) {
          checkDate = getPreviousWorkday(checkDate);
          continue;
        }

        const hasReflectionOnDate =
          sortedDates.some((date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === checkDate.getTime();
          }) || isHoliday(checkDate) || isProtectedDate(checkDate, protectedDates);

        if (hasReflectionOnDate) {
          oldStreak++;
          checkDate = getPreviousWorkday(checkDate);
        } else {
          break;
        }
      }
    }
  } else {
    eligibleGapDate = new Date(currentDate);
    let checkDate = getPreviousWorkday(today);

    while (true) {
      if (isWeekend(checkDate)) {
        checkDate = getPreviousWorkday(checkDate);
        continue;
      }

      const hasReflectionOnDate =
        sortedDates.some((date) => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === checkDate.getTime();
        }) || isHoliday(checkDate) || isProtectedDate(checkDate, protectedDates);

      if (hasReflectionOnDate) {
        if (!lastActiveDate) lastActiveDate = new Date(checkDate);
        oldStreak++;
        checkDate = getPreviousWorkday(checkDate);
      } else {
        break;
      }
    }
  }

  const eligibleProtectDate =
    eligibleGapDate && !isWeekend(eligibleGapDate) && !isHoliday(eligibleGapDate) && withinLookback(eligibleGapDate, today)
      ? toLocalDateKey(eligibleGapDate)
      : null;

  return {
    currentStreak: hasCurrentStreak ? currentStreak : oldStreak,
    oldStreak,
    lastActiveDate,
    hasCurrentStreak: hasCurrentStreak || oldStreak > 0,
    eligibleProtectDate,
  };
}

export function getDisplayStreak(sd: StreakData): number {
  return sd.hasCurrentStreak ? sd.currentStreak : sd.oldStreak > 0 ? sd.oldStreak : 0;
}

export function useStreakCalculation(reflections: Reflection[], protectedDates: Set<string> = new Set()): StreakData {
  return useMemo(() => calculateStreakData(reflections, protectedDates), [reflections, protectedDates]);
}
