import { calculateStreakData, getDisplayStreak } from "@/hooks/use-streak-calculation";
import type { Reflection } from "@/hooks/use-reflections";
import type { GenmateGardenMember } from "@/domain/types";
import type { GardenMember } from "@/components/genmate-garden";
import type { GenmateFieldMember } from "@/components/farm/GenmateField";
import { getPlantVariant } from "@/lib/plant-variants";
import { getPlantTier, getEffectivePlantDays } from "@/lib/streak-milestones";

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
        plant_reactions: m.plant_reactions ?? [],
      },
      streakData,
      variant: getPlantVariant(m._id, {
        palette: m.selected_palette,
        species: m.selected_species,
        pot: m.selected_pot,
        leaf: m.selected_leaf,
        flower: m.selected_flower,
        stem: m.selected_stem,
      }),
      displayStreak,
      tier: getPlantTier(getEffectivePlantDays(displayStreak, m.growth_points ?? 0)),
      growthPoints: m.growth_points ?? 0,
    };
  });
}

/** Adapts the 2D grid's `GardenMember`s into the 3D farm's member shape —
 * same underlying data (`mapGenmateMembers`), no separate fetch or model. */
export function toFarmMembers(members: GardenMember[]): GenmateFieldMember[] {
  return members.map((m) => ({
    id: m.user._id,
    name: `${m.user.first_name ?? ""} ${m.user.last_name ?? ""}`.trim() || "Unknown learner",
    species: m.variant.species,
    tier: m.tier,
    palette: m.variant.palette,
    active: m.streakData.hasCurrentStreak,
    displayStreakDays: m.displayStreak,
  }));
}
