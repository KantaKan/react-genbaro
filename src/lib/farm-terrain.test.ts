import { describe, it, expect } from "vitest";
import { terrainHeightAt, TERRAIN_MARGIN } from "@/lib/farm-terrain";

const FLAT_HALF_W = 6;
const FLAT_HALF_D = 6;

describe("terrainHeightAt", () => {
  it("is exactly 0 at multiple points strictly inside the flat zone", () => {
    const points: Array<[number, number]> = [
      [0, 0],
      [3, 3],
      [-5.9, 5.9],
      [FLAT_HALF_W, 0],
      [0, FLAT_HALF_D],
      [FLAT_HALF_W, FLAT_HALF_D],
    ];
    for (const [x, z] of points) {
      expect(terrainHeightAt(x, z, FLAT_HALF_W, FLAT_HALF_D)).toBe(0);
    }
  });

  it("is nonzero and bounded outside the flat zone", () => {
    const points: Array<[number, number]> = [
      [FLAT_HALF_W + 3, 0],
      [0, FLAT_HALF_D + 4],
      [FLAT_HALF_W + 2, FLAT_HALF_D + 2],
      [-(FLAT_HALF_W + 3), 0],
    ];
    for (const [x, z] of points) {
      const h = terrainHeightAt(x, z, FLAT_HALF_W, FLAT_HALF_D);
      expect(h).toBeGreaterThan(0);
      expect(h).toBeLessThanOrEqual(0.6);
    }
  });

  it("has no sharp jump right at the flat-zone boundary", () => {
    const atBoundary = terrainHeightAt(FLAT_HALF_W + 0.01, 0, FLAT_HALF_W, FLAT_HALF_D);
    const farOut = terrainHeightAt(FLAT_HALF_W + 5, 0, FLAT_HALF_W, FLAT_HALF_D);
    expect(atBoundary).toBeLessThan(0.05);
    expect(atBoundary).toBeLessThan(farOut);
  });

  it("is deterministic — same inputs produce the same output", () => {
    const a = terrainHeightAt(9, -4, FLAT_HALF_W, FLAT_HALF_D);
    const b = terrainHeightAt(9, -4, FLAT_HALF_W, FLAT_HALF_D);
    expect(a).toBe(b);
  });

  it("TERRAIN_MARGIN comfortably covers the background trees' max placement distance", () => {
    // buildBackgroundTrees places trees up to ~2.6 units beyond the fence,
    // which itself sits right at the flat-zone edge — TERRAIN_MARGIN must
    // clear that plus the blend band itself.
    expect(TERRAIN_MARGIN).toBeGreaterThan(2.6 + 2);
  });
});
