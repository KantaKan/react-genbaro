import { describe, it, expect } from "vitest";
import { getAllPalettes } from "@/lib/plant-variants";
import { resolvePlantAppearance } from "@/lib/plant-appearance";
import { restingPalette } from "@/lib/resting-palette";
import { getPlantTierConfig, type PlantTier } from "@/lib/streak-milestones";
import {
  archetypeForSpecies,
  buildArchetypeParts,
  buildPlantParts,
  getCachedPlantParts,
  maxPartHeight,
  maxHorizontalExtent,
  FARM_ARCHETYPE_ORDER,
  SPECIES_MODIFIERS,
  buildPlantGeometry,
} from "@/lib/farm-geometry";

const ALL_SPECIES = [
  "flower", "cactus", "succulent", "tree", "fern", "vine", "bamboo", "palm",
  "mushroom", "pine", "clover", "orchid", "coral", "grass", "lotus", "bonsai", "flytrap",
  "sunflower", "topiary", "strawberry", "tulip", "pumpkin-vine", "coffee",
] as const;

const TIERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const satisfies readonly PlantTier[];

describe("archetypeForSpecies", () => {
  it("maps every one of the 23 real species to one of the 8 archetypes — ticket 09", () => {
    for (const species of ALL_SPECIES) {
      expect(FARM_ARCHETYPE_ORDER).toContain(archetypeForSpecies(species));
    }
  });

  it("defines an explicit 3D modifier for every species", () => {
    expect(Object.keys(SPECIES_MODIFIERS).sort()).toEqual([...ALL_SPECIES].sort());
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

describe("active vs. resting coloring", () => {
  it("softens the chosen palette while keeping its identity", () => {
    const forest = getAllPalettes().find((p) => p.name === "Forest")!;
    const ocean = getAllPalettes().find((p) => p.name === "Ocean")!;
    const tierConfig = getPlantTierConfig(7);
    const active = buildArchetypeParts("bloom", 7, forest, tierConfig, true);
    const inactive = buildArchetypeParts("bloom", 7, forest, tierConfig, false);
    const restingOcean = buildArchetypeParts("bloom", 7, ocean, tierConfig, false);
    const activeColors = new Set(active.map((p) => p.color));
    const inactiveColors = new Set(inactive.map((p) => p.color));
    expect(activeColors.has(forest.stem)).toBe(true);
    expect(inactiveColors.has(forest.stem)).toBe(false);
    expect(inactiveColors.has(restingPalette(forest).stem)).toBe(true);
    expect(restingOcean).not.toEqual(inactive);
  });

  it("does not change the plant's own height — only color, plus the active-only face", () => {
    const forest = getAllPalettes().find((p) => p.name === "Forest")!;
    const tierConfig = getPlantTierConfig(7);
    const active = buildArchetypeParts("bloom", 7, forest, tierConfig, true);
    const inactive = buildArchetypeParts("bloom", 7, forest, tierConfig, false);
    expect(maxPartHeight(active)).toBeCloseTo(maxPartHeight(inactive), 10);
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

  it("keeps distinct cache entries for species sharing an archetype", () => {
    const forest = getAllPalettes().find((p) => p.name === "Forest")!;
    const tierConfig = getPlantTierConfig(6);
    const flower = getCachedPlantParts("flower", 6, forest, tierConfig);
    const tulip = getCachedPlantParts("tulip", 6, forest, tierConfig);
    expect(flower).not.toBe(tulip);
    expect(flower).not.toEqual(tulip);
  });

  it("keys active and resting palettes separately", () => {
    const forest = getAllPalettes().find((p) => p.name === "Forest")!;
    const tierConfig = getPlantTierConfig(6);
    const active = getCachedPlantParts("flower", 6, forest, tierConfig, true);
    const inactive = getCachedPlantParts("flower", 6, forest, tierConfig, false);
    expect(active).not.toBe(inactive);
    const ocean = getAllPalettes().find((p) => p.name === "Ocean")!;
    expect(getCachedPlantParts("flower", 6, ocean, tierConfig, false)).not.toBe(inactive);
  });

  it("matches buildPlantParts' output for a fresh key", () => {
    const ocean = getAllPalettes().find((p) => p.name === "Ocean")!;
    const tierConfig = getPlantTierConfig(3);
    expect(getCachedPlantParts("cactus", 3, ocean, tierConfig)).toEqual(
      buildPlantParts("cactus", 3, ocean, tierConfig)
    );
  });
});

describe("species signatures", () => {
  it.each([
    ["flower", "sunflower"],
    ["cactus", "bamboo"],
    ["succulent", "pumpkin-vine"],
    ["tree", "palm"],
    ["fern", "lotus"],
  ] as const)("makes %s and %s geometrically distinct", (first, second) => {
    const forest = getAllPalettes().find((palette) => palette.name === "Forest")!;
    const tierConfig = getPlantTierConfig(7);

    expect(buildPlantParts(first, 7, forest, tierConfig)).not.toEqual(
      buildPlantParts(second, 7, forest, tierConfig),
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

describe("buildPlantGeometry", () => {
  it("carries the canonical appearance into geometry with explicit style fallbacks", () => {
    const appearance = resolvePlantAppearance({
      userId: "farm-learner",
      tier: 7,
      active: false,
      growthPoints: 150,
      overrides: {
        species: "coffee",
        palette: "Ocean",
        pot: "trophy",
        leaf: "wide",
        flower: "star",
        stem: "leaning",
      },
      cosmetics: { aura: "aura-gold", accessory: "ladybug" },
    });

    const geometry = buildPlantGeometry(appearance);

    expect(geometry.appearance).toBe(appearance);
    expect(geometry.parts.length).toBeGreaterThan(0);
    expect(geometry.rendererStyles).toEqual({
      pot: { requested: "trophy", rendered: "round", supported: false },
      leaf: { requested: "wide", rendered: "rounded", supported: false },
      flower: { requested: "star", rendered: "daisy", supported: false },
      stem: { requested: "leaning", rendered: "curved", supported: false },
    });
    expect(geometry.unsupportedCosmetics).toEqual(["aura", "accessory"]);
    expect(geometry.appearance.growth).toMatchObject({ points: 150, flourishTier: 2 });
    expect(new Set(geometry.parts.map((part) => part.color))).toContain(restingPalette(appearance.palette).stem);
  });
});
