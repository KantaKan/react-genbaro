import { describe, it, expect } from "vitest";
import { getPlantVariant, getAllPalettes } from "./plant-variants";

describe("getPlantVariant palette override", () => {
  it("applies the override when given a valid palette name", () => {
    const base = getPlantVariant("user-123");
    const overridden = getPlantVariant("user-123", "Ocean");

    expect(overridden.palette.name).toBe("Ocean");
    // other axes stay derived from the same hash, unaffected by the override
    expect(overridden.pot).toBe(base.pot);
    expect(overridden.leaf).toBe(base.leaf);
    expect(overridden.flower).toBe(base.flower);
    expect(overridden.stem).toBe(base.stem);
    expect(overridden.species).toBe(base.species);
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

  it("is deterministic per userId and picks a species from the full pool", () => {
    const species = new Set([
      "flower", "cactus", "succulent", "tree", "fern", "vine", "bamboo", "palm",
      "mushroom", "pine", "clover", "orchid", "coral", "grass", "lotus", "bonsai", "flytrap",
      "sunflower", "topiary", "strawberry", "tulip", "pumpkin-vine",
    ]);
    for (const id of ["a", "b", "c", "d", "e", "f"]) {
      const variant = getPlantVariant(id);
      expect(species.has(variant.species)).toBe(true);
      expect(getPlantVariant(id)).toEqual(variant);
    }
  });
});

describe("getAllPalettes", () => {
  it("returns every palette, unlock-free", () => {
    expect(getAllPalettes().length).toBeGreaterThanOrEqual(16);
  });
});
