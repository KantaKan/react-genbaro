import { describe, it, expect } from "vitest";
import { buildFenceParts, buildGroundProps, buildBackgroundTrees } from "@/lib/farm-decorations";

function expectFinite(parts: ReturnType<typeof buildFenceParts>) {
  for (const part of parts) {
    for (const n of [...part.position, ...(part.args as number[]), ...(part.rotation ?? []), ...(part.scale ?? [])]) {
      expect(Number.isFinite(n)).toBe(true);
    }
  }
}

describe("buildFenceParts", () => {
  it("produces only finite geometry for a range of field sizes", () => {
    for (const [w, d] of [[10, 10], [25.8, 25.8], [40, 60]]) {
      expectFinite(buildFenceParts(w, d));
    }
  });

  it("scales up (more posts) for a larger field", () => {
    expect(buildFenceParts(60, 60).length).toBeGreaterThan(buildFenceParts(10, 10).length);
  });
});

describe("buildGroundProps", () => {
  it("returns nothing for an empty tile list", () => {
    expect(buildGroundProps([])).toEqual([]);
  });

  it("produces only finite geometry, deterministically (same input → same output)", () => {
    const tiles = [{ x: 5, z: -5 }, { x: -5, z: 5 }, { x: 0, z: 0 }];
    const a = buildGroundProps(tiles);
    const b = buildGroundProps(tiles);
    expectFinite(a);
    expect(a).toEqual(b);
  });

  it("produces at least one part per empty tile", () => {
    const tiles = [{ x: 1, z: 1 }, { x: 2, z: 2 }, { x: 3, z: 3 }, { x: 4, z: 4 }];
    const parts = buildGroundProps(tiles);
    expect(parts.length).toBeGreaterThanOrEqual(tiles.length);
  });
});

describe("buildBackgroundTrees", () => {
  it("produces only finite geometry for a range of field sizes", () => {
    for (const [w, d] of [[10, 10], [25.8, 25.8], [40, 60]]) {
      expectFinite(buildBackgroundTrees(w, d));
    }
  });

  it("is deterministic — same input produces the same output", () => {
    expect(buildBackgroundTrees(20, 20)).toEqual(buildBackgroundTrees(20, 20));
  });

  it("places every tree outside the field's own footprint", () => {
    const landW = 20;
    const landD = 20;
    const parts = buildBackgroundTrees(landW, landD);
    for (const part of parts) {
      const [x, , z] = part.position;
      const outsideX = Math.abs(x) > landW / 2;
      const outsideZ = Math.abs(z) > landD / 2;
      expect(outsideX || outsideZ).toBe(true);
    }
  });

  it("sits trees on the terrain's rolling apron, not a fixed Y", () => {
    const landW = 20;
    const landD = 20;
    const parts = buildBackgroundTrees(landW, landD);
    const trunkYs = parts.filter((p) => p.kind === "cylinder").map((p) => p.position[1]);
    const distinctYs = new Set(trunkYs.map((y) => Math.round(y * 1000)));
    expect(distinctYs.size).toBeGreaterThan(1);
  });
});
