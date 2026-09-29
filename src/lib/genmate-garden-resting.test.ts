import { afterEach, describe, expect, it, vi } from "vitest";
import { mapGenmateMembers, toFarmMembers } from "./genmate-garden";
import type { GenmateGardenMember } from "@/domain/types";

afterEach(() => vi.useRealTimers());

describe("genmate resting and comeback", () => {
  it("keeps the same unlocked tier and palette in grid and farm after a return", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-15T05:00:00Z"));
    const member = {
      _id: "learner-1",
      first_name: "Mai",
      last_name: "Garden",
      cohort_number: 16,
      genmate_group: "A",
      reflection_dates: ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-15"],
      protected_dates: [],
      growth_points: 0,
      selected_palette: "Ocean",
      selected_species: "flower",
    } as GenmateGardenMember;

    const [gridMember] = mapGenmateMembers([member], new Set());
    const [farmMember] = toFarmMembers([gridMember]);

    expect(gridMember.streakData.currentStreak).toBe(1);
    expect(gridMember.streakData.bestStreak).toBe(5);
    expect(gridMember.appearance.tier).toBeGreaterThan(1);
    expect(gridMember.appearance.palette.name).toBe("Ocean");
    expect(farmMember.appearance).toBe(gridMember.appearance);
  });
});
