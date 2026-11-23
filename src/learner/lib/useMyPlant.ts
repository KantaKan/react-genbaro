import { useMemo } from "react";
import { useQuery } from "react-query";
import { useUserData } from "@/UserDataContext";
import { useHolidayDates } from "@/hooks/use-holiday-dates";
import { useStreakCalculation } from "@/hooks/use-streak-calculation";
import type { Reflection as HookReflection } from "@/hooks/use-reflections";
import { getEffectivePlantDays, getNextTierProgress, getPlantTier, getPlantTierConfig, type PlantTier } from "@/lib/streak-milestones";
import { resolvePlantAppearance } from "@/lib/plant-appearance";
import type { Reflection } from "@/domain/types";
import { learnerApi } from "../api";
import { bangkokNow } from "./time";
import { toNights, weekStrip } from "../reflections/model";

const NONE = new Set<string>();
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** The learner's plant is their streak: nights in a row, growth stage, this week, and how it looks. */
export function useMyPlant() {
  const { userData: me } = useUserData();
  const id = me?._id;
  const q = useQuery(["my-reflections", id], () => learnerApi.getMyReflections(id!), { enabled: !!id });
  const holidays = useHolidayDates() ?? NONE;
  const protectedDates = useMemo(
    () => new Set((me?.care_energy_log ?? []).filter((e) => e.kind === "protect" && e.relatedDate).map((e) => e.relatedDate as string)),
    [me?.care_energy_log]
  );
  const raw = useMemo(() => (q.data ?? []) as Reflection[], [q.data]);
  const streak = useStreakCalculation(raw as unknown as HookReflection[], protectedDates, holidays);
  const today = bangkokNow().date;
  const week = useMemo(() => weekStrip(toNights(raw), today, holidays, protectedDates), [raw, today, holidays, protectedDates]);

  const nights = streak.hasCurrentStreak ? streak.currentStreak : 0;
  const growth = me?.growth_points ?? 0;
  const progress = getNextTierProgress(streak.currentStreak, growth);
  const tier = getPlantTier(getEffectivePlantDays(streak.currentStreak, growth));
  const appearance = useMemo(
    () =>
      id
        ? resolvePlantAppearance({
            userId: id,
            tier,
            active: streak.hasCurrentStreak,
            growthPoints: growth,
            overrides: {
              palette: me?.selected_palette,
              species: me?.selected_species,
              pot: me?.selected_pot,
              leaf: me?.selected_leaf,
              flower: me?.selected_flower,
              stem: me?.selected_stem,
            },
            cosmetics: me?.equipped_cosmetics,
          })
        : null,
    [id, tier, streak.hasCurrentStreak, growth, me]
  );

  const dow = new Date(`${today}T12:00:00Z`).getUTCDay();
  // Streaks only count class days: a weekend or holiday night neither grows nor breaks it.
  const paused: "weekend" | "holiday" | null = dow === 0 || dow === 6 ? "weekend" : holidays.has(today) ? "holiday" : null;

  return {
    ready: !!id && q.isSuccess,
    paused,
    nights,
    best: streak.bestStreak,
    writtenToday: raw.some((r) => (r.day || r.date || "").slice(0, 10) === today),
    stage: cap(getPlantTierConfig(tier).name),
    nextStage: progress.isMaxTier ? null : cap(getPlantTierConfig((tier + 1) as PlantTier).name),
    toNext: progress.isMaxTier ? 0 : progress.max - progress.current,
    pct: progress.isMaxTier ? 100 : Math.round((progress.current / Math.max(1, progress.max)) * 100),
    week,
    appearance,
  };
}
