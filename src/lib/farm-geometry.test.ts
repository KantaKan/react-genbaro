import { describe, it, expect } from "vitest";
import { getAllPalettes } from "@/lib/plant-variants";
import { getPlantTierConfig, type PlantTier } from "@/lib/streak-milestones";
import {
  archetypeForSpecies,
  buildArchetypeParts,
  buildPlantParts,
  getCachedPlantParts,
  maxPartHeight,
  maxHorizontalExtent,
  FARM_ARCHETYPE_ORDER,
} from "@/lib/farm-geometry";

const ALL_SPECIES = [
  "flower", "cactus", "succulent", "tree", "fern", "vine", "bamboo", "palm",
  "mushroom", "pine", "clover", "orchid", "coral", "grass", "lotus", "bonsai", "flytrap",
  "sunflower", "topiary", "strawberry", "tulip", "pumpkin-vine",
] as const;

const TIERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const satisfies readonly PlantTier[];

describe("archetypeForSpecies", () => {
  it("maps every one of the 22 real species to one of the 8 archetypes — ticket 09", () => {
    for (const species of ALL_SPECIES) {
      expect(FARM_ARCHETYPE_ORDER).toContain(archetypeForSpecies(species));
    }
  });
});

describe("buildArchetypeParts", () => {
  const palettes = getAllPalettes();

  it("produces only finite coordinates across every archetype × tier × palette", () => {
    for (const archetype of FARM_ARCHETYPE_ORDER) {
      for (const tier of TIERS) {
        const tierConfig = getPlantTierConfig(tier);
        for (const palette of palettes) {
          const parts = buildArchetypeParts(archetype, tier, palette, tierConfig);
          expect(parts.length).toBeGreaterThan(0);
          for (const part of parts) {
            for (const n of [...part.position, ...(part.args as number[])]) {
              expect(Number.isFinite(n)).toBe(true);
            }
            if (part.pivot) {
              for (const n of [...part.pivot.position, ...part.pivot.rotation]) {
                expect(Number.isFinite(n)).toBe(true);
              }
            }
          }
        }
      }
    }
  });

  it("is a pure function — same inputs produce structurally identical output", () => {
    const tierConfig = getPlantTierConfig(7);
    const a = buildArchetypeParts("bloom", 7, palettes[0], tierConfig);
    const b = buildArchetypeParts("bloom", 7, palettes[0], tierConfig);
    expect(a).toEqual(b);
  });

  it("renders visibly larger geometry at higher tiers — the actual growth", () => {
    const forest = palettes.find((p) => p.name === "Forest")!;
    for (const archetype of FARM_ARCHETYPE_ORDER) {
      const short = maxPartHeight(buildArchetypeParts(archetype, 1, forest, getPlantTierConfig(1)));
      const tall = maxPartHeight(buildArchetypeParts(archetype, 9, forest, getPlantTierConfig(9)));
      expect(tall).toBeGreaterThan(short);
    }
  });
});

describe("active vs. inactive (streak-lapsed) coloring — matches SeedlingPlant's grey fallback", () => {
  it("uses grey, not the palette color, when active is false", () => {
    const forest = getAllPalettes().find((p) => p.name === "Forest")!;
    const tierConfig = getPlantTierConfig(7);
    const active = buildArchetypeParts("bloom", 7, forest, tierConfig, true);
    const inactive = buildArchetypeParts("bloom", 7, forest, tierConfig, false);
    const activeColors = new Set(active.map((p) => p.color));
    const inactiveColors = new Set(inactive.map((p) => p.color));
    expect(activeColors.has(forest.stem)).toBe(true);
    expect(inactiveColors.has(forest.stem)).toBe(false);
    expect(inactiveColors.has("#a1a1aa")).toBe(true); // real SeedlingPlant grey stem fallback
  });

  it("does not change the plant's own height — only color, plus the active-only face", () => {
    const forest = getAllPalettes().find((p) => p.name === "Forest")!;
    const tierConfig = getPlantTierConfig(7);
    const active = buildArchetypeParts("bloom", 7, forest, tierConfig, true);
    const inactive = buildArchetypeParts("bloom", 7, forest, tierConfig, false);
    expect(maxPartHeight(active)).toBeCloseTo(maxPartHeight(inactive), 10);
    // Active gets the 5-part cute pot face (2 eyes, a smile, 2 blush cheeks) —
    // matches the real 2D SeedlingPlant, which only draws the face when active.
    expect(active.length).toBe(inactive.length + 5);
  });
});

describe("potFaceParts — the cute face, ported from the real 2D pot", () => {
  it("only appears when active, matching SeedlingPlant's exact gating", () => {
    const forest = getAllPalettes().find((p) => p.name === "Forest")!;
    const tierConfig = getPlantTierConfig(5);
    for (const archetype of FARM_ARCHETYPE_ORDER) {
      const active = buildArchetypeParts(archetype, 5, forest, tierConfig, true);
      const inactive = buildArchetypeParts(archetype, 5, forest, tierConfig, false);
      expect(active.length - inactive.length).toBe(5);
    }
  });

  it("produces only finite geometry, including the new torus smile", () => {
    const forest = getAllPalettes().find((p) => p.name === "Forest")!;
    const parts = buildArchetypeParts("bloom", 5, forest, getPlantTierConfig(5), true);
    const torusParts = parts.filter((p) => p.kind === "torus");
    expect(torusParts.length).toBe(1);
    for (const part of torusParts) {
      for (const n of [...part.position, ...part.rotation!, ...(part.args as number[])]) {
        expect(Number.isFinite(n)).toBe(true);
      }
    }
  });
});

describe("getCachedPlantParts — ticket 04's cache", () => {
  it("returns the same array reference for the same (archetype, tier, palette)", () => {
    const forest = getAllPalettes().find((p) => p.name === "Forest")!;
    const tierConfig = getPlantTierConfig(6);
    const a = getCachedPlantParts("flower", 6, forest, tierConfig);
    const b = getCachedPlantParts("flower", 6, forest, tierConfig);
    expect(a).toBe(b);
  });

  it("shares one cache entry across two species mapping to the same archetype", () => {
    // "flower" and "tulip" both resolve to Bloom — deliberately not part of the
    // cache key, since they'd produce identical geometry.
    const forest = getAllPalettes().find((p) => p.name === "Forest")!;
    const tierConfig = getPlantTierConfig(6);
    const flower = getCachedPlantParts("flower", 6, forest, tierConfig);
    const tulip = getCachedPlantParts("tulip", 6, forest, tierConfig);
    expect(flower).toBe(tulip);
  });

  it("keys active vs. inactive separately, so grey never leaks into the active cache slot", () => {
    const forest = getAllPalettes().find((p) => p.name === "Forest")!;
    const tierConfig = getPlantTierConfig(6);
    const active = getCachedPlantParts("flower", 6, forest, tierConfig, true);
    const inactive = getCachedPlantParts("flower", 6, forest, tierConfig, false);
    expect(active).not.toBe(inactive);
  });

  it("matches buildPlantParts' output for a fresh key", () => {
    const ocean = getAllPalettes().find((p) => p.name === "Ocean")!;
    const tierConfig = getPlantTierConfig(3);
    expect(getCachedPlantParts("cactus", 3, ocean, tierConfig)).toEqual(
      buildPlantParts("cactus", 3, ocean, tierConfig)
    );
  });
});

describe("maxHorizontalExtent", () => {
  it("grows with tier, the basis for ticket 02's tile sizing", () => {
    const forest = getAllPalettes().find((p) => p.name === "Forest")!;
    for (const archetype of FARM_ARCHETYPE_ORDER) {
      const small = maxHorizontalExtent(buildArchetypeParts(archetype, 1, forest, getPlantTierConfig(1)));
      const large = maxHorizontalExtent(buildArchetypeParts(archetype, 9, forest, getPlantTierConfig(9)));
      expect(large).toBeGreaterThanOrEqual(small);
      expect(large).toBeGreaterThan(0);
    }
  });
});
