import { useMemo } from "react";
import type { PlantPalette, PlantSpecies } from "@/lib/plant-variants";
import { getPlantTierConfig, type PlantTier } from "@/lib/streak-milestones";
import { getCachedPlantParts, maxPartHeight, type FarmPart } from "@/lib/farm-geometry";

/**
 * Pulls from the ticket-04 module-level cache — calling this from both
 * `PlantMesh` and a parent scene (for aura/hit-box height) is cheap, the
 * second call is a cache hit, not a rebuild.
 */
export function useFarmPlantParts(species: PlantSpecies, tier: PlantTier, palette: PlantPalette, active: boolean): FarmPart[] {
  return useMemo(
    () => getCachedPlantParts(species, tier, palette, getPlantTierConfig(tier), active),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [species, tier, palette.name, active]
  );
}

export function useFarmPlantHeight(parts: FarmPart[]): number {
  return useMemo(() => maxPartHeight(parts), [parts]);
}
