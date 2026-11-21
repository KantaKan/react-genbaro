import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { resolvePlantAppearance } from "@/lib/plant-appearance";
import { SeedlingPlant } from "./streak-components";

describe("SeedlingPlant", () => {
  it("keeps the mature vine visible above the pot in both activity states", () => {
    for (const active of [true, false]) {
      const appearance = resolvePlantAppearance({ userId: "vine-learner", tier: 9, active, overrides: { species: "vine" } });
      const { unmount } = render(<SeedlingPlant appearance={appearance} showParticles={false} />);
      const canopy = screen.getByTestId("vine-canopy");
      const climbingStem = canopy.querySelector('path[d^="M20 41 C"]');
      expect(climbingStem).not.toBeNull();
      expect(canopy.querySelectorAll("ellipse").length).toBeGreaterThan(10);
      unmount();
    }
  });

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
