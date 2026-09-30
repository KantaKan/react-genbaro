import { describe, expect, it } from "vitest";
import type { LawnMood, ShowcaseEntry } from "@/application/services/showcaseLawnService";
import { LAWN_LITE_LIMIT, LAWN_WINDOW_MS, planLawn, type LawnPlan } from "./lawn-planner";
import { SPOT_POSES, YARD_SCENES, YARD_SCENE_IDS } from "./lawn-scenes";

const entry = (ownerId: string, mood?: LawnMood, moodUntil?: string) => ({
  owner_id: ownerId, name: ownerId, cohort: 16, team: "Alpha", message: "", updated_at: "2026-09-29T00:00:00Z", mood, mood_until: moodUntil,
  character: { id: `c-${ownerId}`, owner_id: ownerId, serial: `B-${ownerId}`, fingerprint: ownerId, source: "starter", is_starter: true, created_at: "2026-09-29T00:00:00Z", dna: { version: 1, body: "bean", ears: "cat", eyes: "dots", mark: "star", palette: "Mint", pattern: "polka", pattern_seed: 1, rarity: "normal" as const } },
}) satisfies ShowcaseEntry;

const cohort = Array.from({ length: 45 }, (_, index) => entry(`learner-${index}`));
const morning = Date.UTC(2026, 8, 30, 3, 0);
const night = Date.UTC(2026, 8, 30, 15, 0);
const until = new Date(morning + 23 * 60 * 60 * 1000).toISOString();
const backyard = YARD_SCENES.backyard;
const ids = (plan: LawnPlan) => plan.placements.map((placement) => placement.entry.owner_id);
const windows = (count: number, start = morning) => Array.from({ length: count }, (_, window) => start + window * LAWN_WINDOW_MS);

describe("planLawn", () => {
  it("keeps twelve characters per scene with the viewer always present", () => {
    for (const sceneId of YARD_SCENE_IDS) {
      for (const now of windows(8)) {
        const plan = planLawn({ entries: cohort, scene: YARD_SCENES[sceneId], viewerId: "learner-7", now });
        expect(plan.placements).toHaveLength(12);
        expect(ids(plan)).toContain("learner-7");
        expect(new Set(ids(plan)).size).toBe(12);
      }
    }
  });

  it("gives each spot one occupant and only poses that spot allows", () => {
    for (const sceneId of YARD_SCENE_IDS) {
      for (const now of [...windows(24), ...windows(12, night)]) {
        const plan = planLawn({ entries: cohort, scene: YARD_SCENES[sceneId], viewerId: "learner-3", now });
        const spots = plan.placements.map((placement) => placement.spot.id);
        expect(new Set(spots).size).toBe(spots.length);
        for (const placement of plan.placements) {
          const allowed = SPOT_POSES[placement.spot.kind];
          expect([...allowed.solo, ...allowed.pair, ...allowed.night]).toContain(placement.pose);
          expect(placement.activity.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("returns the same plan for the same inputs, scene, and window", () => {
    const first = planLawn({ entries: cohort, scene: backyard, viewerId: "learner-1", now: morning });
    const again = planLawn({ entries: [...cohort].reverse(), scene: backyard, viewerId: "learner-1", now: morning + 60_000 });
    const shape = (plan: LawnPlan) => plan.placements.map((placement) => `${placement.entry.owner_id}@${placement.spot.id}:${placement.pose}`).concat(plan.cats.map((cat) => `${cat.cat.id}:${cat.pose}:${cat.x}`));
    expect(shape(again)).toEqual(shape(first));
  });

  it("rotates visitors fairly across windows", () => {
    const seen = new Map<string, number>();
    for (const now of windows(44)) for (const id of ids(planLawn({ entries: cohort, scene: backyard, viewerId: "learner-0", now }))) seen.set(id, (seen.get(id) ?? 0) + 1);
    seen.delete("learner-0");
    expect(seen.size).toBe(44);
    expect(Math.max(...seen.values()) - Math.min(...seen.values())).toBeLessThanOrEqual(1);
  });

  it("pairs characters only across neighbouring spots and faces them toward each other", () => {
    let pairs = 0;
    for (const sceneId of YARD_SCENE_IDS) {
      for (const now of windows(24)) {
        const plan = planLawn({ entries: cohort.slice(0, 12), scene: YARD_SCENES[sceneId], viewerId: "learner-0", now });
        for (const placement of plan.placements.filter((item) => item.partnerId)) {
          const partner = plan.placements.find((item) => item.entry.owner_id === placement.partnerId)!;
          expect(placement.spot.neighbours).toContain(partner.spot.id);
          expect(placement.facing).toBe(placement.spot.x < partner.spot.x ? "right" : "left");
          pairs++;
        }
      }
    }
    expect(pairs).toBeGreaterThan(100);
  });

  it("does not repeat the previous window's pairs", () => {
    const pairKeys = (now: number) => new Set(planLawn({ entries: cohort.slice(0, 12), scene: backyard, viewerId: "learner-0", now }).placements
      .filter((placement) => placement.partnerId).map((placement) => [placement.entry.owner_id, placement.partnerId].sort().join("|")));
    for (const now of windows(30).slice(1)) {
      const before = pairKeys(now - LAWN_WINDOW_MS);
      for (const key of pairKeys(now)) expect(before.has(key)).toBe(false);
    }
  });

  it("keeps play gentle with no paper-sword or competitive poses", () => {
    const poses = new Set<string>();
    for (const sceneId of YARD_SCENE_IDS) for (const now of windows(48)) for (const placement of planLawn({ entries: cohort, scene: YARD_SCENES[sceneId], viewerId: "learner-0", now }).placements) poses.add(placement.pose);
    expect([...poses].some((pose) => /sword|fight|win|score/i.test(pose))).toBe(false);
    for (const pose of ["eat", "sit", "walk", "pillow", "smile"]) expect(poses).toContain(pose);
  });

  it("never pairs a quiet learner or puts a cat on their lap", () => {
    const entries = cohort.slice(0, 12).map((item) => item.owner_id === "learner-5" ? entry("learner-5", "quiet", until) : item);
    for (const sceneId of YARD_SCENE_IDS) {
      for (const now of windows(40)) {
        const plan = planLawn({ entries, scene: YARD_SCENES[sceneId], viewerId: "learner-0", now });
        const quiet = plan.placements.find((placement) => placement.entry.owner_id === "learner-5")!;
        expect(quiet.partnerId).toBeUndefined();
        expect(SPOT_POSES[quiet.spot.kind].pair.includes(quiet.pose) && !SPOT_POSES[quiet.spot.kind].solo.includes(quiet.pose)).toBe(false);
        expect(plan.cats.some((cat) => cat.lapOf === "learner-5")).toBe(false);
      }
    }
  });

  it("biases moods toward their spots without forcing them", () => {
    const share = (mood: LawnMood, kinds: string[]) => {
      let hits = 0;
      for (const now of windows(40)) {
        const entries = cohort.slice(0, 12).map((item) => item.owner_id === "learner-5" ? entry("learner-5", mood, until) : item);
        const placement = planLawn({ entries, scene: backyard, viewerId: "learner-0", now }).placements.find((item) => item.entry.owner_id === "learner-5")!;
        if (kinds.includes(placement.spot.kind)) hits++;
      }
      return hits;
    };
    const baseline = (kinds: string[]) => {
      let hits = 0;
      for (const now of windows(40)) if (kinds.includes(planLawn({ entries: cohort.slice(0, 12), scene: backyard, viewerId: "learner-0", now }).placements.find((item) => item.entry.owner_id === "learner-5")!.spot.kind)) hits++;
      return hits;
    };
    expect(share("meal", ["table", "blanket"])).toBeGreaterThan(baseline(["table", "blanket"]));
    expect(share("relaxing", ["bench", "tree", "blanket"])).toBeGreaterThan(baseline(["bench", "tree", "blanket"]));
    expect(share("playful", ["play"])).toBeGreaterThan(baseline(["play"]));
  });

  it("uses Thailand time for morning, evening, and night", () => {
    expect(planLawn({ entries: [], scene: backyard, now: Date.UTC(2026, 8, 30, 1, 0) }).phase).toBe("morning");
    expect(planLawn({ entries: [], scene: backyard, now: Date.UTC(2026, 8, 30, 11, 0) }).phase).toBe("evening");
    expect(planLawn({ entries: [], scene: backyard, now: Date.UTC(2026, 8, 30, 14, 0) }).phase).toBe("night");
    expect(planLawn({ entries: [], scene: backyard, now: Date.UTC(2026, 8, 29, 22, 30) }).phase).toBe("night");
  });

  it("lets more characters doze at night while some stay awake", () => {
    const dozing = (start: number) => windows(24, start).reduce((sum, now) => sum + planLawn({ entries: cohort.slice(0, 12), scene: backyard, viewerId: "learner-0", now }).placements.filter((placement) => placement.pose === "doze").length, 0);
    const awakeAtNight = windows(24, night).every((now) => planLawn({ entries: cohort.slice(0, 12), scene: backyard, viewerId: "learner-0", now }).placements.some((placement) => placement.pose !== "doze"));
    expect(dozing(night)).toBeGreaterThan(dozing(morning));
    expect(awakeAtNight).toBe(true);
  });

  it("places cats by personality in allowed spots", () => {
    const poses = new Set<string>();
    for (const sceneId of YARD_SCENE_IDS) {
      const scene = YARD_SCENES[sceneId];
      for (const now of windows(30)) {
        const plan = planLawn({ entries: cohort.slice(0, 12), scene, viewerId: "learner-0", now });
        expect(plan.cats.length).toBeGreaterThan(0);
        expect(plan.cats.length).toBeLessThanOrEqual(3);
        for (const cat of plan.cats) {
          poses.add(cat.pose);
          if (cat.pose === "lap") {
            const host = plan.placements.find((placement) => placement.entry.owner_id === cat.lapOf)!;
            expect(host.spot.kind).toBe("bench");
          } else {
            expect(scene.catSpots.some((spot) => spot.x === cat.x && spot.y === cat.y)).toBe(true);
          }
        }
        expect(new Set(plan.cats.map((cat) => `${cat.x},${cat.y}`)).size).toBe(plan.cats.length);
      }
    }
    for (const pose of ["beg", "loaf", "chase", "lap"]) expect(poses).toContain(pose);
  });

  it("keeps the light lawn at six characters and one cat", () => {
    for (const now of windows(10)) {
      const plan = planLawn({ entries: cohort, scene: backyard, viewerId: "learner-9", now, limit: LAWN_LITE_LIMIT });
      expect(plan.placements).toHaveLength(6);
      expect(ids(plan)).toContain("learner-9");
      expect(plan.cats).toHaveLength(1);
    }
  });

  it("treats surprise and expired moods like the ordinary planner", () => {
    const plain = windows(20).map((now) => planLawn({ entries: cohort.slice(0, 12), scene: backyard, viewerId: "learner-0", now }).placements.map((placement) => placement.spot.id + placement.pose).join());
    const withMood = (mood: LawnMood, moodUntil: string) => windows(20).map((now) => planLawn({ entries: cohort.slice(0, 12).map((item) => item.owner_id === "learner-5" ? entry("learner-5", mood, moodUntil) : item), scene: backyard, viewerId: "learner-0", now }).placements.map((placement) => placement.spot.id + placement.pose).join());
    expect(withMood("surprise", until)).toEqual(plain);
    expect(withMood("quiet", new Date(morning - 1).toISOString())).toEqual(plain);
  });

  it("keeps a visit pair on the lawn side by side, even past the rotation limit", () => {
    const visitUntil = new Date(morning + 90 * 60 * 1000).toISOString();
    const visitor = { ...entry("learner-2"), emote: "visit" as const, emote_target: "learner-40", emote_until: visitUntil };
    const entries = cohort.map((item) => item.owner_id === "learner-2" ? visitor : item);
    for (const viewerId of ["learner-2", "learner-40"]) {
      for (const now of windows(3)) {
        const plan = planLawn({ entries, scene: backyard, viewerId, now });
        const a = plan.placements.find((placement) => placement.entry.owner_id === "learner-2");
        const b = plan.placements.find((placement) => placement.entry.owner_id === "learner-40");
        expect(a?.partnerId).toBe("learner-40");
        expect(b?.partnerId).toBe("learner-2");
        expect(a?.spot.neighbours).toContain(b?.spot.id);
      }
    }
    const expired = planLawn({ entries, scene: backyard, viewerId: "learner-2", now: morning + 91 * 60 * 1000 });
    expect(expired.placements.find((placement) => placement.entry.owner_id === "learner-2")?.partnerId).not.toBe("learner-40");
  });
});
