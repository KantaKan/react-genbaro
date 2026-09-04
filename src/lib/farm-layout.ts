import { getAllPalettes, type PlantPalette } from "@/lib/plant-variants";
import { getPlantTierConfig, type GrowthGlowStyle, type PlantTier } from "@/lib/streak-milestones";
import {
  buildArchetypeParts,
  maxHorizontalExtent,
  FARM_ARCHETYPE_ORDER,
  type FarmArchetype,
} from "@/lib/farm-geometry";

/** A 3×3 field covers a typical ~5-person genmate group with room — ticket 02. */
export const GRID_COLS = 3;
export const GRID_ROWS = 3;

/**
 * Tile pitch measured from the real geometry, not guessed: generate every
 * archetype at tier 9 (the tallest, widest growth state) across every real
 * palette, and size the tile from the widest result — ticket 02's answer,
 * verified against a formula-based approach that under-sized tiles once tier
 * scaling changed. Computed once per module load; the combination space is
 * small (8 archetypes × ~16 palettes) so this is cheap.
 */
let cachedTileSize: number | null = null;
export function computeTileSize(): number {
  if (cachedTileSize !== null) return cachedTileSize;
  const tier9Config = getPlantTierConfig(9);
  const palettes = getAllPalettes();
  let maxR = 0;
  for (const archetype of FARM_ARCHETYPE_ORDER) {
    for (const palette of palettes) {
      const parts = buildArchetypeParts(archetype, 9, palette, tier9Config);
      const r = maxHorizontalExtent(parts);
      if (r > maxR) maxR = r;
    }
  }
  cachedTileSize = maxR * 2 * 1.15;
  return cachedTileSize;
}

export interface TilePosition {
  col: number;
  row: number;
}

/**
 * Fill order matters more than the camera angle for avoiding diagonal-tile
 * occlusion — ticket 10, verified by computation. An initial corners-and-
 * center-first guess ("quincunx") looked natural but actually concentrated
 * occlusion into a 3-way stack, since the center tile sits on both grid
 * diagonals at once and is diagonally aligned with something at every 90°
 * rotation step. Corners first, then edge-midpoints, center last (reached
 * only past 8 members, which a genmate group never does) caps the worst-case
 * screen-column stack at 2 instead of 3.
 */
const FILL_ORDER: TilePosition[] = [
  { col: 0, row: 0 }, { col: 2, row: 0 }, { col: 0, row: 2 }, { col: 2, row: 2 }, // corners
  { col: 1, row: 0 }, { col: 2, row: 1 }, { col: 1, row: 2 }, { col: 0, row: 1 }, // edges
  { col: 1, row: 1 }, // center, last
];

/**
 * The 3×3 field is sized for a genmate group, not a whole cohort — a cohort
 * field (COHORT_FARM_SPEC.md's "one big field" option) needs the grid to
 * actually grow with headcount instead of silently dropping anyone past the
 * 9th tile. Defaults preserve the exact tuned 3×3 behavior for every
 * existing caller (single genmate group, ≤9 members).
 */
export function gridDimensionsForCount(count: number): { cols: number; rows: number } {
  if (count <= GRID_COLS * GRID_ROWS) return { cols: GRID_COLS, rows: GRID_ROWS };
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  return { cols, rows };
}

/**
 * The corners-then-edges-then-center order below is hand-tuned for exactly
 * the 3×3 grid (ticket 10) — worth keeping for every genmate-group-sized
 * field. A larger grid (a whole cohort) falls back to plain row-major fill:
 * at that size some occlusion is expected and normal, like looking across an
 * actual crowd, so it isn't worth re-deriving the occlusion-minimizing order
 * for arbitrary dimensions.
 */
export function tilePositionsForCount(count: number, cols: number = GRID_COLS, rows: number = GRID_ROWS): TilePosition[] {
  if (cols === GRID_COLS && rows === GRID_ROWS) {
    return FILL_ORDER.slice(0, Math.min(count, FILL_ORDER.length));
  }
  const positions: TilePosition[] = [];
  for (let row = 0; row < rows && positions.length < count; row++) {
    for (let col = 0; col < cols && positions.length < count; col++) {
      positions.push({ col, row });
    }
  }
  return positions;
}

export function tileCenter(col: number, row: number, tileSize: number, cols: number = GRID_COLS, rows: number = GRID_ROWS): { x: number; z: number } {
  return {
    x: (col - (cols - 1) / 2) * tileSize,
    z: (row - (rows - 1) / 2) * tileSize,
  };
}

export const FIELD_PITCH = 0.52; // ~30°, classic isometric
export const FIELD_YAW_BASE = Math.PI / 4; // 45°, the FFT diamond angle

function rotateXZ(x: number, z: number, yaw: number): { x: number; z: number } {
  return { x: x * Math.cos(yaw) + z * Math.sin(yaw), z: -x * Math.sin(yaw) + z * Math.cos(yaw) };
}

/**
 * Auto-picks whichever of the 4 fixed rotation steps hides the fewest members
 * at a glance — ticket 10. Still correct and worth keeping even though it ties
 * for the spike's own symmetric 6-member layout; it helps for uneven group
 * sizes where the 4 angles genuinely differ.
 */
export function leastOccludingRotationStep(
  positions: TilePosition[],
  tileSize: number,
  cols: number = GRID_COLS,
  rows: number = GRID_ROWS
): number {
  let bestStep = 0;
  let bestExcess = Infinity;
  for (let step = 0; step < 4; step++) {
    const yaw = FIELD_YAW_BASE + step * (Math.PI / 2);
    const columns = new Map<number, number>();
    for (const pos of positions) {
      const c = tileCenter(pos.col, pos.row, tileSize, cols, rows);
      const { x } = rotateXZ(c.x, c.z, yaw);
      const key = Math.round(x * 100);
      columns.set(key, (columns.get(key) ?? 0) + 1);
    }
    const excess = Array.from(columns.values()).reduce((sum, n) => sum + Math.max(0, n - 1), 0);
    if (excess < bestExcess) {
      bestExcess = excess;
      bestStep = step;
    }
  }
  return bestStep;
}

interface AuraLayer {
  mul: number;
  alpha: number;
}
export interface AuraSpec {
  color: string;
  scale: number;
  halo: [AuraLayer, AuraLayer];
  core: AuraLayer;
}

const HALO_LAYERS: Record<Exclude<GrowthGlowStyle, "none">, [AuraLayer, AuraLayer]> = {
  glow: [{ mul: 0.85, alpha: 0.3 }, { mul: 0.42, alpha: 0.42 }],
  radiant: [{ mul: 1.05, alpha: 0.34 }, { mul: 0.5, alpha: 0.48 }],
  bloom: [{ mul: 1.3, alpha: 0.38 }, { mul: 0.6, alpha: 0.52 }],
  "bloom-ring": [{ mul: 1.3, alpha: 0.38 }, { mul: 0.6, alpha: 0.52 }], // not used by any real tier today; falls back to `bloom`'s layers
  aurora: [{ mul: 1.7, alpha: 0.42 }, { mul: 0.75, alpha: 0.56 }],
};
const CORE_LAYER: Record<Exclude<GrowthGlowStyle, "none">, AuraLayer> = {
  glow: { mul: 0.3, alpha: 0.55 },
  radiant: { mul: 0.36, alpha: 0.62 },
  bloom: { mul: 0.44, alpha: 0.68 },
  "bloom-ring": { mul: 0.44, alpha: 0.68 },
  aurora: { mul: 0.56, alpha: 0.75 },
};

export function auraSpecForTier(tier: PlantTier): AuraSpec | null {
  const config = getPlantTierConfig(tier);
  if (config.growthGlow === "none") return null;
  return {
    color: config.glowColor,
    scale: config.glowScale,
    halo: HALO_LAYERS[config.growthGlow],
    core: CORE_LAYER[config.growthGlow],
  };
}

export type ParticleType = "pollen" | "petal" | "leaf" | "light";
export interface ParticleDef {
  type: ParticleType;
  seed: number;
}

/**
 * Ports the real split from streak-components.tsx verbatim (pollen 35% / petal
 * 30% / leaf 20% / light remainder of `particleCount`, gated by that tier's
 * `particleTypes`) — but leaf and petal fall while pollen and light rise,
 * unlike the 2D component's all-rising default. That direction was explicit,
 * not a port bug.
 */
export function buildParticleDefs(tier: PlantTier): ParticleDef[] {
  const config = getPlantTierConfig(tier);
  const pc = config.particleCount;
  const counts: Record<ParticleType, number> = {
    pollen: Math.ceil(pc * 0.35),
    petal: Math.ceil(pc * 0.3),
    leaf: Math.ceil(pc * 0.2),
    light: 0,
  };
  counts.light = pc - counts.pollen - counts.petal - counts.leaf;
  const defs: ParticleDef[] = [];
  (["pollen", "petal", "leaf", "light"] as ParticleType[]).forEach((type) => {
    if (!config.particleTypes.includes(type)) return;
    for (let i = 0; i < counts[type]; i++) defs.push({ type, seed: defs.length * 7.31 + i * 3.17 + 1 });
  });
  return defs;
}

export function isRisingParticle(type: ParticleType): boolean {
  return type === "pollen" || type === "light";
}

export interface FarmMember {
  id: string;
  archetype: FarmArchetype;
  tier: PlantTier;
  palette: PlantPalette;
}
