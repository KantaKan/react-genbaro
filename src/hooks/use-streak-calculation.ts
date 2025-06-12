"use client";

import { useMemo } from "react";
import type { Reflection, StreakData } from "./use-reflections";

const HOLIDAYS = [new Date("2025-04-07"), new Date("2025-04-13"), new Date("2025-04-14"), new Date("2025-04-15"), new Date("2025-05-01"), new Date("2025-05-05"), new Date("2025-05-12")].map((date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
});

const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const isHoliday = (date: Date): boolean => {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  return HOLIDAYS.some((holiday) => holiday.getTime() === normalizedDate.getTime());
};

const isValidWorkday = (date: Date): boolean => {
  return !isWeekend(date) && !isHoliday(date);
};

const getPreviousWorkday = (date: Date): Date => {
  const prevDate = new Date(date);
  prevDate.setDate(prevDate.getDate() - 1);

  while (!isValidWorkday(prevDate)) {
    prevDate.setDate(prevDate.getDate() - 1);
  }

  return prevDate;
};

export function useStreakCalculation(reflections: Reflection[]): StreakData {
  return useMemo(() => {
    if (reflections.length === 0) {
      return {
        currentStreak: 0,
        oldStreak: 0,
        lastActiveDate: null,
        hasCurrentStreak: false,
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

    const hasTodayReflection =
      sortedDates.some((date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      }) || isHoliday(today);

    let currentDate = new Date(today);
    if (isWeekend(today)) {
      while (isWeekend(currentDate)) {
        currentDate.setDate(currentDate.getDate() - 1);
      }

      const hasLastWorkdayReflection =
        sortedDates.some((date) => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === currentDate.getTime();
        }) || isHoliday(currentDate);

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
          }) || isHoliday(checkDate);

        if (hasReflectionOnDate) {
          currentStreak++;
          if (!lastActiveDate) lastActiveDate = new Date(checkDate);
          checkDate = getPreviousWorkday(checkDate);
        } else {
          streakBroken = true;
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
            }) || isHoliday(checkDate);

          if (hasReflectionOnDate) {
            oldStreak++;
            checkDate = getPreviousWorkday(checkDate);
          } else {
            break;
          }
        }
      }
    } else {
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
          }) || isHoliday(checkDate);

        if (hasReflectionOnDate) {
          if (!lastActiveDate) lastActiveDate = new Date(checkDate);
          oldStreak++;
          checkDate = getPreviousWorkday(checkDate);
        } else {
          break;
        }
      }
    }

    return {
      currentStreak: hasCurrentStreak ? currentStreak : 0,
      oldStreak,
      lastActiveDate,
      hasCurrentStreak,
    };
  }, [reflections]);
}
