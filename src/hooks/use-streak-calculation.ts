import { useMemo } from "react";
import type { Reflection, StreakData } from "./use-reflections";
import { getThailandDateISO, isHoliday, isWeekend, toLocalDateKey } from "../utils/date-utils";

// ponytail: 7-day lookback window is a placeholder product number, move to a config constant if it needs tuning
const PROTECT_LOOKBACK_DAYS = 7;

function withinLookback(date: Date, today: Date): boolean {
  const diffDays = (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= PROTECT_LOOKBACK_DAYS;
}

export function calculateStreakData(reflections: Reflection[], protectedDates: Set<string> = new Set(), holidayDates?: Set<string>): StreakData {
  const today = calendarDate(getThailandDateISO());
  const reflectionDates = new Set(reflections.map((reflection) => reflectionDay(reflection)).filter(Boolean));
  const activeDates = new Set([...reflectionDates, ...protectedDates]);
  const isDayOff = (date: Date) => isWeekend(date) || (holidayDates ? holidayDates.has(toLocalDateKey(date)) : isHoliday(date));
  const previousWorkday = (date: Date) => {
    const previous = new Date(date);
    do {
      previous.setDate(previous.getDate() - 1);
    } while (isDayOff(previous));
    return previous;
  };
  const lastReflectionKey = latestKeyBefore(reflectionDates, toLocalDateKey(today), true);
  const lastActiveDate = lastReflectionKey ? calendarDate(lastReflectionKey) : null;

  let latestEligible = new Date(today);
  while (isDayOff(latestEligible)) latestEligible = previousWorkday(latestEligible);
  const latestKey = toLocalDateKey(latestEligible);
  const start = activeDates.has(latestKey) ? latestEligible : previousWorkday(latestEligible);
  const hasCurrentStreak = activeDates.has(toLocalDateKey(start));

  let currentStreak = 0;
  let oldStreak = 0;
  let gapDate: Date | null = null;
  if (hasCurrentStreak) {
    let cursor = start;
    while (activeDates.has(toLocalDateKey(cursor))) {
      currentStreak++;
      cursor = previousWorkday(cursor);
    }
    gapDate = cursor;
    const previousActivityKey = latestKeyBefore(activeDates, toLocalDateKey(gapDate));
    if (previousActivityKey) {
      cursor = calendarDate(previousActivityKey);
      while (activeDates.has(toLocalDateKey(cursor))) {
        oldStreak++;
        cursor = previousWorkday(cursor);
      }
    }
  } else {
    const latestActivityKey = latestKeyBefore(activeDates, toLocalDateKey(today), true);
    if (latestActivityKey) {
      const latestActivity = calendarDate(latestActivityKey);
      gapDate = nextWorkday(latestActivity, isDayOff);
      let cursor = latestActivity;
      while (activeDates.has(toLocalDateKey(cursor))) {
        oldStreak++;
        cursor = previousWorkday(cursor);
      }
    }
  }

  const eligibleProtectDate = gapDate && gapDate < today && withinLookback(gapDate, today)
    ? toLocalDateKey(gapDate)
    : null;

  let bestStreak = 0;
  let run = 0;
  let previousActivity: Date | null = null;
  for (const key of [...activeDates].filter((date) => date <= toLocalDateKey(today)).sort()) {
    const date = calendarDate(key);
    if (isDayOff(date)) continue;
    run = previousActivity && toLocalDateKey(previousWorkday(date)) === toLocalDateKey(previousActivity) ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    previousActivity = date;
  }

  return { currentStreak, oldStreak, bestStreak, lastActiveDate, hasCurrentStreak, eligibleProtectDate };
}

function calendarDate(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function latestKeyBefore(keys: Set<string>, cutoff: string, inclusive = false): string | undefined {
  let latest: string | undefined;
  for (const key of keys) {
    if ((inclusive ? key <= cutoff : key < cutoff) && (!latest || key > latest)) latest = key;
  }
  return latest;
}

function reflectionDay(reflection: Reflection): string {
  if (reflection.day) return reflection.day;
  return new Date(reflection.date).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function nextWorkday(date: Date, isDayOff: (date: Date) => boolean): Date {
  const next = new Date(date);
  do {
    next.setDate(next.getDate() + 1);
  } while (isDayOff(next));
  return next;
}

export function getDisplayStreak(sd: StreakData): number {
  return sd.hasCurrentStreak ? sd.currentStreak : sd.oldStreak > 0 ? sd.oldStreak : 0;
}

export function useStreakCalculation(reflections: Reflection[], protectedDates: Set<string> = new Set(), holidayDates?: Set<string>): StreakData {
  return useMemo(() => calculateStreakData(reflections, protectedDates, holidayDates), [reflections, protectedDates, holidayDates]);
}
