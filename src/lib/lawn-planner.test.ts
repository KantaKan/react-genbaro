import { describe, expect, it } from "vitest";
import type { ShowcaseEntry } from "@/application/services/showcaseLawnService";
import { LAWN_WINDOW_MS, planLawn } from "./lawn-planner";

const entry = (ownerId: string, team = "Alpha", hidden = false) => ({
  owner_id: ownerId, name: ownerId, cohort: 16, team, hidden, message: "", updated_at: "2026-09-29T00:00:00Z",
  character: { id: `c-${ownerId}`, owner_id: ownerId, serial: `B-${ownerId}`, fingerprint: ownerId, source: "starter", is_starter: true, created_at: "2026-09-29T00:00:00Z", dna: { version: 1, body: "bean", ears: "cat", eyes: "dots", mark: "star", palette: "Mint", pattern: "polka", pattern_seed: 1, rarity: "normal" as const } },
}) satisfies ShowcaseEntry;

const cohort = Array.from({ length: 45 }, (_, index) => entry(`learner-${index}`, index % 2 ? "Alpha" : "Beta"));
const now = Date.UTC(2026, 8, 30, 3, 0);
const ids = (plan: ReturnType<typeof planLawn>) => plan.placements.map((placement) => placement.entry.owner_id);

describe("planLawn", () => {
  it("keeps a cohort scene at twelve and always includes the viewer", () => {
    for (let window = 0; window < 10; window++) {
      const plan = planLawn({ entries: cohort, viewerId: "learner-7", now: now + window * LAWN_WINDOW_MS });
      expect(plan.placements).toHaveLength(12);
      expect(ids(plan)).toContain("learner-7");
      expect(new Set(ids(plan)).size).toBe(12);
    }
  });

  it("includes the viewer's own pin from outside the filtered list unless it is hidden", () => {
    const team = cohort.filter((item) => item.team === "Beta");
    const mine = entry("learner-7");
    expect(ids(planLawn({ entries: team, viewerId: "learner-7", mine, now }))).toContain("learner-7");
    expect(ids(planLawn({ entries: team, viewerId: "learner-7", mine: { ...mine, hidden: true }, now }))).not.toContain("learner-7");
  });

  it("shows everyone when the lawn is small", () => {
    expect(planLawn({ entries: cohort.slice(0, 5), viewerId: "nobody", now }).placements).toHaveLength(5);
    expect(planLawn({ entries: [], viewerId: "nobody", now }).placements).toHaveLength(0);
  });

  it("returns the same selection and layout for the same inputs and window", () => {
    const first = planLawn({ entries: cohort, viewerId: "learner-1", now });
    const later = planLawn({ entries: [...cohort].reverse(), viewerId: "learner-1", now: now + LAWN_WINDOW_MS - 1 - (now % LAWN_WINDOW_MS) });
    expect(later.placements.map(({ entry: item, ...rest }) => ({ id: item.owner_id, ...rest })))
      .toEqual(first.placements.map(({ entry: item, ...rest }) => ({ id: item.owner_id, ...rest })));
  });

  it("rotates visitors fairly so nobody is permanently excluded", () => {
    const seen = new Map<string, number>();
    const windows = 4 * 11;
    for (let window = 0; window < windows; window++) {
      for (const id of ids(planLawn({ entries: cohort, viewerId: "learner-0", now: now + window * LAWN_WINDOW_MS }))) seen.set(id, (seen.get(id) ?? 0) + 1);
    }
    seen.delete("learner-0");
    expect(seen.size).toBe(44);
    const counts = [...seen.values()];
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it("keeps slots unique and offsets small enough to stay inside their cell", () => {
    const plan = planLawn({ entries: cohort, viewerId: "learner-3", now });
    expect(plan.placements.map((placement) => placement.slot)).toEqual([...Array(12).keys()]);
    for (const placement of plan.placements) {
      expect(Math.abs(placement.offsetX)).toBeLessThanOrEqual(8);
      expect(Math.abs(placement.offsetY)).toBeLessThanOrEqual(6);
    }
  });
});
