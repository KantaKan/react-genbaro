import { describe, expect, it } from "vitest";
import { resolvePlantAppearance } from "./plant-appearance";

describe("resolvePlantAppearance", () => {
  it("resolves persisted plant choices with tier and resting state", () => {
    const appearance = resolvePlantAppearance({
      userId: "learner-123",
      tier: 7,
      active: false,
      growthPoints: 150,
      overrides: {
        palette: "Ocean",
        species: "coffee",
        pot: "trophy",
        leaf: "wide",
        flower: "star",
        stem: "leaning",
      },
    });

    expect(appearance).toMatchObject({
      species: "coffee",
      palette: { name: "Ocean" },
      pot: "trophy",
      leaf: "wide",
      flower: "star",
      stem: "leaning",
      tier: 7,
      state: "resting",
      growth: {
        points: 150,
        flourishTier: 2,
        flourishColor: "#C0C0C0",
      },
      tierCapabilities: {
        name: "blooming",
        hasFlower: true,
        hasFruit: false,
      },
    });
  });

  it("normalizes every cosmetic slot without mutating the equipped input", () => {
    const cosmetics = {
      palette: " ",
      aura: " aura-gold ",
      particle: "",
      mutation: "crystal-leaf",
    };

    const appearance = resolvePlantAppearance({
      userId: "learner-456",
      tier: 3,
      active: true,
      cosmetics,
    });

    expect(appearance.cosmetics).toEqual({
      palette: null,
      pot: null,
      aura: "aura-gold",
      particle: null,
      accessory: null,
      mutation: "crystal-leaf",
    });
    expect(cosmetics).toEqual({
      palette: " ",
      aura: " aura-gold ",
      particle: "",
      mutation: "crystal-leaf",
    });
  });

  it.each([
    {
      name: "equipped cosmetics override persisted choices",
      cosmetics: { palette: "Ocean", pot: "trophy" },
      expectedPalette: "Ocean",
      expectedPot: "trophy",
      expectedCosmeticPalette: "Ocean",
      expectedCosmeticPot: "trophy",
    },
    {
      name: "unavailable cosmetics preserve persisted choices",
      cosmetics: { palette: "unknown-palette", pot: "unknown-pot" },
      expectedPalette: "Forest",
      expectedPot: "round",
      expectedCosmeticPalette: null,
      expectedCosmeticPot: null,
    },
  ])("$name", ({ cosmetics, expectedPalette, expectedPot, expectedCosmeticPalette, expectedCosmeticPot }) => {
    const appearance = resolvePlantAppearance({
      userId: "learner-789",
      tier: 5,
      active: true,
      overrides: {
        palette: "Forest",
        pot: "round",
      },
      cosmetics,
    });

    expect(appearance.palette.name).toBe(expectedPalette);
    expect(appearance.pot).toBe(expectedPot);
    expect(appearance.cosmetics.palette).toBe(expectedCosmeticPalette);
    expect(appearance.cosmetics.pot).toBe(expectedCosmeticPot);
  });
});
