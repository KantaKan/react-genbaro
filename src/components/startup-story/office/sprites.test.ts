import { describe, expect, it } from "vitest";
import { decor, desk, hairStyles, icons, oval, PAL, person, rack, roleGear, tint, toPaths, type Grid } from "./sprites";

describe("toPaths", () => {
  it("merges runs into one path per color and skips transparent pixels", () => {
    expect(toPaths(["kk.k", "..kk"])).toEqual([{ fill: PAL.k, d: "M0 0h2v1h-2zM3 0h1v1h-1zM2 1h2v1h-2z", led: false }]);
  });

  it("swaps palette slots and drops slots with no color", () => {
    const paths = toPaths(["15"], { 1: "#123456" });
    expect(paths).toEqual([{ fill: "#123456", d: "M0 0h1v1h-1z", led: false }]);
  });

  it("keeps LED pixels in their own path so they can blink", () => {
    expect(toPaths(["gl"]).map((p) => p.led)).toEqual([false, true]);
  });
});

describe("hand-drawn grids", () => {
  const rect = (name: string, grid: Grid) => {
    const width = Math.max(...grid.map((r) => r.length));
    grid.forEach((row, i) => {
      if (row) expect(row.length, `${name} row ${i}`).toBe(width);
      for (const ch of row) expect(ch === "." || ch in PAL || "134567".includes(ch), `${name} row ${i} char ${ch}`).toBe(true);
    });
  };

  it("are rectangular and only use palette characters", () => {
    Object.entries({ ...person, ...desk, ...decor, ...icons, ...roleGear, rack: rack(3), table: oval(30, 10, "c") }).forEach(([k, g]) => rect(k, g));
    Object.entries(hairStyles).forEach(([k, h]) => Object.entries(h).forEach(([part, g]) => rect(`${k}.${part}`, g)));
  });

  it("line the hair and gear layers up with the 16-wide body", () => {
    for (const g of [person.body, ...Object.values(hairStyles).flatMap((h) => Object.values(h)), ...Object.values(roleGear)]) {
      expect(Math.max(...g.map((r) => r.length))).toBe(16);
    }
  });
});

describe("tint", () => {
  it("darkens below 1 and lightens above 1", () => {
    expect(tint("#808080", 0.5)).toBe("#404040");
    expect(tint("#000000", 1.5)).toBe("#808080");
  });
});
