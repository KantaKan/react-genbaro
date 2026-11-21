import { describe, it, expect } from "vitest";
import { projectLeave } from "./projectLeave";

describe("projectLeave", () => {
  it("adds a day for a date not counted yet", () => expect(projectLeave(4, "2026-11-26", new Set())).toMatchObject({ now: 4, after: 5, level: "first", reachesLimit: false }));
  it("flags the limit", () => expect(projectLeave(7, "2026-11-27", new Set())).toMatchObject({ after: 8, level: "third", reachesLimit: true }));
  it("doesn't double count a day that already counts", () => expect(projectLeave(6, "2026-11-20", new Set(["2026-11-20"]))).toMatchObject({ after: 6, level: "second" }));
});
