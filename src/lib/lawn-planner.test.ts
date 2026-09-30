import { describe, expect, it } from "vitest";
import type { ShowcaseEntry } from "@/application/services/showcaseLawnService";
import { LAWN_ACTIONS, LAWN_LITE_LIMIT, LAWN_WINDOW_MS, LAWN_ZONE_CAPACITY, planLawn } from "./lawn-planner";

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

  it("fits every activity to its zone, participant count, and zone capacity", () => {
    for (let window = 0; window < 48; window++) {
      const plan = planLawn({ entries: cohort, viewerId: "learner-3", now: now + window * LAWN_WINDOW_MS });
      const members = plan.activities.flatMap((activity) => activity.members.map((member) => member.owner_id));
      expect(new Set(members).size).toBe(members.length);
      expect(members.sort()).toEqual(ids(plan).sort());
      for (const activity of plan.activities) {
        const spec = LAWN_ACTIONS[activity.action];
        expect(spec.zones).toContain(activity.zone);
        expect(spec.participants).toContain(activity.members.length);
        if (spec.variants) expect(spec.variants).toContain(activity.variant);
      }
      for (const zone of ["picnic", "bench", "play"]) {
        expect(plan.placements.filter((placement) => placement.zone === zone).length).toBeLessThanOrEqual(LAWN_ZONE_CAPACITY);
      }
    }
  });

  it("mixes solo and paired moments and faces partners toward each other", () => {
    const actions = new Set<string>();
    let pairs = 0;
    for (let window = 0; window < 48; window++) {
      const plan = planLawn({ entries: cohort.slice(0, 12), viewerId: "learner-0", now: now + window * LAWN_WINDOW_MS });
      for (const activity of plan.activities) {
        actions.add(activity.action);
        if (activity.members.length === 2) {
          pairs++;
          const facing = plan.placements.filter((placement) => placement.activityId === activity.id).map((placement) => placement.facing);
          expect(facing).toEqual(["right", "left"]);
        }
      }
    }
    expect(pairs).toBeGreaterThan(48);
    expect([...actions].sort()).toEqual(Object.keys(LAWN_ACTIONS).sort());
  });

  it("avoids repeating the previous window's pairs when other partners exist", () => {
    for (const size of [3, 6, 12, 20, 45]) {
      for (let window = 1; window < 30; window++) {
        const pairKeys = (offset: number) => new Set(planLawn({ entries: cohort.slice(0, size), viewerId: "learner-0", now: now + (window + offset) * LAWN_WINDOW_MS }).activities
          .filter((activity) => activity.members.length === 2).map((activity) => activity.members.map((member) => member.owner_id).sort().join("|")));
        const before = pairKeys(-1);
        for (const key of pairKeys(0)) expect(before.has(key)).toBe(false);
      }
    }
  });

  it("describes play as noncompetitive with no score, health, winner, or reward", () => {
    const banned = /health|damage|winner|loser|rank|score|reward|win|lose/i;
    for (const spec of Object.values(LAWN_ACTIONS)) {
      expect(Object.keys(spec).sort()).toEqual(expect.arrayContaining(["emoji", "label", "participants", "zones"]));
      expect(JSON.stringify(spec)).not.toMatch(banned);
    }
    const plan = planLawn({ entries: cohort.slice(0, 12), viewerId: "learner-0", now });
    for (const activity of plan.activities) for (const key of Object.keys(activity)) expect(["action", "id", "members", "variant", "zone"]).toContain(key);
  });

  it("uses Thailand time for morning and evening lighting", () => {
    expect(planLawn({ entries: [], now: Date.UTC(2026, 8, 30, 1, 0) }).lighting).toBe("morning");
    expect(planLawn({ entries: [], now: Date.UTC(2026, 8, 30, 11, 0) }).lighting).toBe("evening");
    expect(planLawn({ entries: [], now: Date.UTC(2026, 8, 29, 23, 30) }).lighting).toBe("morning");
  });

  it("keeps the light lawn at six with the viewer included and the same fair rotation", () => {
    const seen = new Map<string, number>();
    for (let window = 0; window < 44; window++) {
      const plan = planLawn({ entries: cohort, viewerId: "learner-9", now: now + window * LAWN_WINDOW_MS, limit: LAWN_LITE_LIMIT });
      expect(plan.placements).toHaveLength(6);
      expect(ids(plan)).toContain("learner-9");
      for (const id of ids(plan)) if (id !== "learner-9") seen.set(id, (seen.get(id) ?? 0) + 1);
    }
    expect(seen.size).toBe(44);
    expect(new Set(seen.values())).toEqual(new Set([5]));
  });

  describe("moods", () => {
    const until = new Date(now + 24 * 60 * 60 * 1000).toISOString();
    const withMood = (mood: NonNullable<ShowcaseEntry["mood"]>, moodUntil = until) => cohort.slice(0, 12).map((item) => item.owner_id === "learner-5" ? { ...item, mood, mood_until: moodUntil } : item);
    const activitiesFor = (entries: ShowcaseEntry[]) => Array.from({ length: 47 }, (_, window) => planLawn({ entries, viewerId: "learner-0", now: now + window * LAWN_WINDOW_MS }).activities
      .find((activity) => activity.members.some((member) => member.owner_id === "learner-5"))!);

    it("keeps a quiet learner out of every paired action while they still rest, sit, or walk", () => {
      const activities = activitiesFor(withMood("quiet"));
      expect(activities.every((activity) => activity.members.length === 1)).toBe(true);
      expect(new Set(activities.map((activity) => activity.action)).size).toBeGreaterThan(1);
    });

    it.each([["greeting", ["wave", "smile", "high-five"]], ["meal", ["meal"]], ["playful", ["play", "rps"]], ["relaxing", ["bench-sit", "rest"]]] as const)("biases %s toward its safe actions without forcing a partner", (mood, preferred) => {
      const activities = activitiesFor(withMood(mood));
      const biased = activities.filter((activity) => (preferred as readonly string[]).includes(activity.action)).length;
      const baseline = activitiesFor(cohort.slice(0, 12)).filter((activity) => (preferred as readonly string[]).includes(activity.action)).length;
      expect(biased).toBeGreaterThan(baseline);
      if (mood !== "relaxing") expect(activities.some((activity) => activity.members.length === 1)).toBe(true);
    });

    it("treats surprise and expired moods exactly like the ordinary planner", () => {
      const plain = activitiesFor(cohort.slice(0, 12)).map((activity) => activity.id + activity.action);
      expect(activitiesFor(withMood("surprise")).map((activity) => activity.id + activity.action)).toEqual(plain);
      expect(activitiesFor(withMood("quiet", new Date(now - 1).toISOString())).map((activity) => activity.id + activity.action)).toEqual(plain);
    });
  });
});
