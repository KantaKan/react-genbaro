import { describe, expect, it } from "vitest";
import { LAWN_SCENE_LIMIT } from "./lawn-planner";
import { DEFAULT_YARD_SCENE, SPOT_KINDS, YARD_SCENE_IDS, YARD_SCENES, isYardSceneId } from "./lawn-scenes";

describe("yard scenes", () => {
  it.each(YARD_SCENE_IDS)("%s has valid, unique, in-bounds spots", (sceneId) => {
    const scene = YARD_SCENES[sceneId];
    const ids = [...scene.spots.map((spot) => spot.id), ...scene.catSpots.map((spot) => `cat:${spot.id}`)];
    expect(new Set(ids).size).toBe(ids.length);
    for (const spot of [...scene.spots, ...scene.catSpots]) {
      expect(spot.x).toBeGreaterThan(0);
      expect(spot.x).toBeLessThan(scene.width);
      expect(spot.y).toBeGreaterThan(0);
      expect(spot.y).toBeLessThan(scene.height);
    }
  });

  it.each(YARD_SCENE_IDS)("%s links neighbours symmetrically within the same kind", (sceneId) => {
    const scene = YARD_SCENES[sceneId];
    for (const spot of scene.spots) {
      for (const id of spot.neighbours) {
        const neighbour = scene.spots.find((candidate) => candidate.id === id);
        expect(neighbour?.neighbours).toContain(spot.id);
        expect(neighbour?.kind).toBe(spot.kind);
      }
    }
  });

  it.each(YARD_SCENE_IDS)("%s fits a full scene and covers every spot kind and cat spot kind", (sceneId) => {
    const scene = YARD_SCENES[sceneId];
    expect(scene.spots.length).toBeGreaterThanOrEqual(LAWN_SCENE_LIMIT);
    for (const kind of SPOT_KINDS) expect(scene.spots.some((spot) => spot.kind === kind)).toBe(true);
    for (const kind of ["beg", "loaf", "chase"]) expect(scene.catSpots.some((spot) => spot.kind === kind)).toBe(true);
    expect(scene.catSpots.filter((spot) => spot.kind === "loaf").length).toBeGreaterThanOrEqual(2);
  });

  it("recognises scene ids and defaults to the backyard", () => {
    expect(DEFAULT_YARD_SCENE).toBe("backyard");
    expect(isYardSceneId("engawa")).toBe(true);
    expect(isYardSceneId("moon")).toBe(false);
    expect(isYardSceneId(null)).toBe(false);
  });
});
