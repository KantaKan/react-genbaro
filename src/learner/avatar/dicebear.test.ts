import { describe, it, expect } from "vitest";
import { optionsFor, buildOptions } from "./dicebear";

describe("dicebear helpers", () => {
  it("reads parts from each style's schema", () => {
    const rows = optionsFor("notionists");
    const hair = rows.find((r) => r.key === "hair")!;
    expect(hair.values.length).toBeGreaterThanOrEqual(63);
    expect(hair.values).toContain("variant63");
    expect(rows.find((r) => r.key === "glasses")!.optional).toBe(true);
  });
  it("turns a None choice into a zero probability", () => {
    const o = buildOptions({ style: "notionists", seed: "s", bg: "", options: { notionists: { glasses: null, hair: "variant20" } } });
    expect(o.glassesProbability).toBe(0);
    expect(o.hair).toEqual(["variant20"]);
  });
});
