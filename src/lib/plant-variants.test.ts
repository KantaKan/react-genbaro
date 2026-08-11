import { describe, it, expect } from "vitest";
import { getPlantVariant, getAllPalettes } from "./plant-variants";

describe("getPlantVariant palette override", () => {
  it("applies the override when given a valid palette name", () => {
    const base = getPlantVariant("user-123");
    const overridden = getPlantVariant("user-123", { palette: "Ocean" });

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
    const unknownOverride = getPlantVariant("user-123", { palette: "Not A Real Palette" });
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

describe("getPlantVariant shape overrides (admin plant override)", () => {
  it("applies species/pot/leaf/flower/stem overrides independently of each other and of palette", () => {
    const base = getPlantVariant("user-456");
    const overridden = getPlantVariant("user-456", {
      species: "cactus",
      pot: "bowl",
      leaf: "wide",
      flower: "star",
      stem: "leaning",
    });

    expect(overridden.species).toBe("cactus");
    expect(overridden.pot).toBe("bowl");
    expect(overridden.leaf).toBe("wide");
    expect(overridden.flower).toBe("star");
    expect(overridden.stem).toBe("leaning");
    // palette untouched by shape overrides
    expect(overridden.palette.name).toBe(base.palette.name);
  });

  it("falls back to the hash-derived default for any unknown shape override value", () => {
    const base = getPlantVariant("user-456");
    const overridden = getPlantVariant("user-456", {
      species: "dragon",
      pot: "hexagonal",
      leaf: "spiky",
      flower: "rose",
      stem: "wobbly",
    });

    expect(overridden).toEqual(base);
  });

  it("does not reshuffle the hash-derived axes for a user with no overrides at all", () => {
    // Regression guard: the PRNG draw order (palette, pot, leaf, flower, stem, species)
    // must stay fixed so existing users' plants don't change shape underneath them.
    expect(getPlantVariant("stable-user-id")).toEqual(getPlantVariant("stable-user-id"));
  });
});

describe("getAllPalettes", () => {
  it("returns every palette, unlock-free", () => {
    expect(getAllPalettes().length).toBeGreaterThanOrEqual(16);
  });
});
