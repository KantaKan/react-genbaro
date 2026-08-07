import { calculateStreakData, getDisplayStreak } from "@/hooks/use-streak-calculation";
import type { Reflection } from "@/hooks/use-reflections";
import type { GenmateGardenMember } from "@/domain/types";
import type { GardenMember } from "@/components/genmate-garden";
import { getPlantVariant } from "@/lib/plant-variants";
import { getPlantTier } from "@/lib/streak-milestones";

export function mapGenmateMembers(members: GenmateGardenMember[]): GardenMember[] {
  return members.map((m) => {
    const reflections = m.reflection_dates.map(
      (d) => ({ day: d }) as unknown as Reflection
    );
    const protectedDates = new Set(m.protected_dates ?? []);
    const streakData = calculateStreakData(reflections, protectedDates);
    const displayStreak = getDisplayStreak(streakData);
    return {
      user: {
        _id: m._id,
        first_name: m.first_name,
        last_name: m.last_name,
        cohort_number: m.cohort_number,
        genmate_group: m.genmate_group,
        reflections,
      },
      streakData,
      variant: getPlantVariant(m._id),
      displayStreak,
      tier: getPlantTier(displayStreak),
      growthPoints: m.growth_points ?? 0,
    };
  });
}
