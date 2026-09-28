import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { resolvePlantAppearance } from "@/lib/plant-appearance";
import { SeedlingPlant } from "./streak-components";

describe("SeedlingPlant", () => {
  it.each([
    {
      name: "renders a persisted active variant",
      input: {
        userId: "learner-active",
        tier: 7 as const,
        active: true,
        growthPoints: 150,
        overrides: { species: "coffee" as const, palette: "Ocean", pot: "trophy" },
      },
      expected: { species: "coffee", state: "active", tier: "7", palette: "Ocean", pot: "trophy" },
    },
    {
      name: "renders deterministic fallbacks for unavailable choices",
      input: {
        userId: "learner-fallback",
        tier: 2 as const,
        active: false,
        overrides: { palette: "unknown", pot: "unknown" },
      },
      expected: { state: "resting", tier: "2" },
    },
  ])("$name", ({ input, expected }) => {
    const appearance = resolvePlantAppearance(input);

    render(<SeedlingPlant appearance={appearance} showParticles={false} />);

    expect(screen.getByTestId("seedling-plant")).toEqual(
      expect.objectContaining({
        dataset: expect.objectContaining(expected),
      }),
    );
  });
});
