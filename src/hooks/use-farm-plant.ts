import { useMemo } from "react";
import type { PlantAppearance } from "@/lib/plant-appearance";
import { buildPlantGeometry, maxPartHeight, type FarmPart, type FarmPlantGeometry } from "@/lib/farm-geometry";

/**
 * Pulls from the ticket-04 module-level cache — calling this from both
 * `PlantMesh` and a parent scene (for aura/hit-box height) is cheap, the
 * second call is a cache hit, not a rebuild.
 */
export function useFarmPlantGeometry(appearance: PlantAppearance): FarmPlantGeometry {
  return useMemo(() => buildPlantGeometry(appearance), [appearance]);
}

export function useFarmPlantParts(appearance: PlantAppearance): FarmPart[] {
  return useFarmPlantGeometry(appearance).parts;
}

export function useFarmPlantHeight(parts: FarmPart[]): number {
  return useMemo(() => maxPartHeight(parts), [parts]);
}
