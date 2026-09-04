import { describe, it, expect } from "vitest";
import { getPlantTierConfig, type PlantTier } from "@/lib/streak-milestones";
import {
  computeTileSize,
  tilePositionsForCount,
  tileCenter,
  leastOccludingRotationStep,
  gridDimensionsForCount,
  auraSpecForTier,
  buildParticleDefs,
  isRisingParticle,
  GRID_COLS,
  GRID_ROWS,
} from "@/lib/farm-layout";

describe("computeTileSize — ticket 02, measured from real geometry", () => {
  it("returns a positive, finite, memoized value", () => {
    const a = computeTileSize();
    const b = computeTileSize();
    expect(a).toBeGreaterThan(0);
    expect(Number.isFinite(a)).toBe(true);
    expect(a).toBe(b); // memoized, not recomputed
  });
});

describe("tilePositionsForCount — ticket 10's verified fill order", () => {
  it("fills the 4 corners first", () => {
    const positions = tilePositionsForCount(4);
    const corners = [
      { col: 0, row: 0 }, { col: 2, row: 0 }, { col: 0, row: 2 }, { col: 2, row: 2 },
    ];
    expect(positions).toEqual(corners);
  });

  it("puts the center last, only reached past 8 members", () => {
    const eight = tilePositionsForCount(8);
    const nine = tilePositionsForCount(9);
    expect(eight).not.toContainEqual({ col: 1, row: 1 });
    expect(nine).toContainEqual({ col: 1, row: 1 });
  });

  it("caps at the 3×3 grid's 9 tiles", () => {
    expect(tilePositionsForCount(20).length).toBe(GRID_COLS * GRID_ROWS);
  });

  it("never places two members on the same tile", () => {
    const positions = tilePositionsForCount(9);
    const keys = new Set(positions.map((p) => `${p.col},${p.row}`));
    expect(keys.size).toBe(9);
  });
});

describe("gridDimensionsForCount — cohort field scaling", () => {
  it("stays the tuned 3×3 for a genmate-group-sized count", () => {
    expect(gridDimensionsForCount(5)).toEqual({ cols: GRID_COLS, rows: GRID_ROWS });
    expect(gridDimensionsForCount(9)).toEqual({ cols: GRID_COLS, rows: GRID_ROWS });
  });

  it("grows to fit a whole cohort instead of staying capped at 9", () => {
    const { cols, rows } = gridDimensionsForCount(30);
    expect(cols * rows).toBeGreaterThanOrEqual(30);
  });
});

describe("tilePositionsForCount — a bigger grid doesn't silently drop members", () => {
  it("returns one position per member when the grid is sized for the cohort", () => {
    const count = 25;
    const { cols, rows } = gridDimensionsForCount(count);
    const positions = tilePositionsForCount(count, cols, rows);
    expect(positions.length).toBe(count);
    const keys = new Set(positions.map((p) => `${p.col},${p.row}`));
    expect(keys.size).toBe(count);
  });
});

describe("tileCenter — non-default grid dimensions", () => {
  it("centers the grid around the origin for an arbitrary cols/rows", () => {
    const tileSize = 2;
    const cols = 5;
    const rows = 4;
    const first = tileCenter(0, 0, tileSize, cols, rows);
    const last = tileCenter(cols - 1, rows - 1, tileSize, cols, rows);
    expect(first.x).toBeCloseTo(-last.x, 10);
    expect(first.z).toBeCloseTo(-last.z, 10);
  });
});

describe("leastOccludingRotationStep — ticket 10", () => {
  it("always returns a valid rotation step", () => {
    const tileSize = computeTileSize();
    for (let n = 1; n <= 9; n++) {
      const step = leastOccludingRotationStep(tilePositionsForCount(n), tileSize);
      expect(step).toBeGreaterThanOrEqual(0);
      expect(step).toBeLessThanOrEqual(3);
    }
  });

  it("the verified 6-member corners-then-edges layout caps worst-case stacking at 2, never 3", () => {
    const tileSize = computeTileSize();
    const positions = tilePositionsForCount(6);
    for (let step = 0; step < 4; step++) {
      const yaw = Math.PI / 4 + step * (Math.PI / 2);
      const columns = new Map<number, number>();
      for (const pos of positions) {
        const c = tileCenter(pos.col, pos.row, tileSize);
        const x = c.x * Math.cos(yaw) + c.z * Math.sin(yaw);
        const key = Math.round(x * 100);
        columns.set(key, (columns.get(key) ?? 0) + 1);
      }
      expect(Math.max(...columns.values())).toBeLessThanOrEqual(2);
    }
  });
});

describe("auraSpecForTier", () => {
  it("is null at tier 0 (growthGlow 'none')", () => {
    expect(auraSpecForTier(0)).toBeNull();
  });

  it("matches the real PLANT_TIER_CONFIGS glow color/scale at every other tier", () => {
    for (let tier = 1; tier <= 9; tier++) {
      const spec = auraSpecForTier(tier as PlantTier);
      const config = getPlantTierConfig(tier as PlantTier);
      expect(spec).not.toBeNull();
      expect(spec!.color).toBe(config.glowColor);
      expect(spec!.scale).toBe(config.glowScale);
    }
  });
});

describe("buildParticleDefs — ports the real split verbatim", () => {
  it("is empty at tier 0 (particleCount 0)", () => {
    expect(buildParticleDefs(0)).toEqual([]);
  });

  it("matches the real pollen 35% / petal 30% / leaf 20% / light-remainder split at tier 9", () => {
    const config = getPlantTierConfig(9);
    const defs = buildParticleDefs(9);
    expect(defs.length).toBe(config.particleCount);
    const counts = { pollen: 0, petal: 0, leaf: 0, light: 0 };
    defs.forEach((d) => counts[d.type]++);
    expect(counts.pollen).toBe(Math.ceil(config.particleCount * 0.35));
    expect(counts.petal).toBe(Math.ceil(config.particleCount * 0.3));
    expect(counts.leaf).toBe(Math.ceil(config.particleCount * 0.2));
    expect(counts.light).toBe(config.particleCount - counts.pollen - counts.petal - counts.leaf);
  });

  it("only produces types the tier's particleTypes actually gates in", () => {
    // tier 1 ("sprout") only has ["pollen"] in the real config
    const defs = buildParticleDefs(1);
    expect(defs.every((d) => d.type === "pollen")).toBe(true);
  });
});

describe("isRisingParticle", () => {
  it("classifies pollen and light as rising, petal and leaf as falling — explicit direction, not the 2D component's all-rising default", () => {
    expect(isRisingParticle("pollen")).toBe(true);
    expect(isRisingParticle("light")).toBe(true);
    expect(isRisingParticle("petal")).toBe(false);
    expect(isRisingParticle("leaf")).toBe(false);
  });
});
