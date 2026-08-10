import { describe, it, expect } from "vitest";
import { getPlantVariant, getUnlockedPalettes, getPaletteUnlockTier, getAllPalettes } from "./plant-variants";

describe("getPlantVariant palette override", () => {
  it("applies the override when given an unlocked palette name", () => {
    const base = getPlantVariant("user-123");
    const overridden = getPlantVariant("user-123", "Ocean");

    expect(overridden.palette.name).toBe("Ocean");
    // other axes stay derived from the same hash, unaffected by the override
    expect(overridden.pot).toBe(base.pot);
    expect(overridden.leaf).toBe(base.leaf);
    expect(overridden.flower).toBe(base.flower);
    expect(overridden.stem).toBe(base.stem);
  });

  it("falls back to the hash-derived default when no override is given", () => {
    const base = getPlantVariant("user-123");
    const noOverride = getPlantVariant("user-123", undefined);
    expect(noOverride.palette.name).toBe(base.palette.name);
  });

  it("falls back to the hash-derived default when the override name is unknown", () => {
    const base = getPlantVariant("user-123");
    const unknownOverride = getPlantVariant("user-123", "Not A Real Palette");
    expect(unknownOverride.palette.name).toBe(base.palette.name);
  });
});

describe("palette unlock progression", () => {
  it("unlocks no palettes below tier 2", () => {
    expect(getUnlockedPalettes(0)).toHaveLength(0);
    expect(getUnlockedPalettes(1)).toHaveLength(0);
  });

  it("unlocks all palettes at max tier", () => {
    expect(getUnlockedPalettes(5)).toHaveLength(getAllPalettes().length);
  });

  it("is cumulative — every palette unlocked at a tier stays unlocked at higher tiers", () => {
    const tiers = [0, 1, 2, 3, 4, 5] as const;
    for (let i = 0; i < tiers.length - 1; i++) {
      expect(getUnlockedPalettes(tiers[i]).length).toBeLessThanOrEqual(getUnlockedPalettes(tiers[i + 1]).length);
    }
  });

  it("getPaletteUnlockTier matches getUnlockedPalettes boundaries", () => {
    const all = getAllPalettes();
    all.forEach((_, index) => {
      const tier = getPaletteUnlockTier(index);
      expect(getUnlockedPalettes(tier).length).toBeGreaterThan(index);
      if (tier > 0) {
        expect(getUnlockedPalettes((tier - 1) as 0 | 1 | 2 | 3 | 4).length).toBeLessThanOrEqual(index);
      }
    });
  });
});
