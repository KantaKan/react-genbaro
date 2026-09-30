import { describe, expect, it } from "vitest";
import type { StartupDev } from "@/application/services/startupStoryService";
import { isSassy, roleLook, sassLine, teamHints } from "./startupStoryCatalog";

const dev = (id: string, role?: string): StartupDev => ({ id, name: id, title: "", sprite: "dev", role, frontend: 3, backend: 3, design: 3, debug: 3, salary: 0 });

describe("teamHints", () => {
  it("warns about missing testers and big teams without a PM", () => {
    const texts = teamHints([dev("a", "fe_dev"), dev("b", "be_dev"), dev("c", "designer")], null).map((h) => h.text);
    expect(texts.some((t) => t.includes("No QA or SA"))).toBe(true);
    expect(texts.some((t) => t.includes("No PM"))).toBe(true);
  });

  it("flags the 3AM outage without DevOps or QA", () => {
    const texts = teamHints([dev("a", "fe_dev")], "outage-3am").map((h) => h.text);
    expect(texts.some((t) => t.includes("3AM outage"))).toBe(true);
  });

  it("praises support roles that are on the project", () => {
    const hints = teamHints([dev("a", "fe_dev"), dev("q", "qa"), dev("m", "pm")], null);
    expect(hints.filter((h) => h.tone === "warn")).toEqual([]);
    expect(hints.map((h) => h.text).join(" ")).toMatch(/QA on board.*|PM on board/);
  });
});

describe("roleLook", () => {
  it("falls back to a generic developer for runs made before roles existed", () => {
    expect(roleLook(undefined).label).toBe("Developer");
    expect(roleLook("po").short).toBe("PO");
  });
});

describe("sassy teammates", () => {
  const people = Array.from({ length: 30 }, (_, i) => dev(`cand-${i}`, "fe_dev"));

  it("makes some fictional devs sassy, never real genmates", () => {
    expect(people.some(isSassy)).toBe(true);
    expect(people.every(isSassy)).toBe(false);
    expect(people.map((p) => ({ ...p, genmate_id: "u1" })).some(isSassy)).toBe(false);
  });

  it("only throws shade at fictional teammates, never at a genmate or themself", () => {
    const speaker = dev("s", "be_dev");
    const genmate = { ...dev("g", "qa"), name: "RealFriend", genmate_id: "u9" };
    const target = { ...dev("t", "pm"), name: "Nat" };
    for (let i = 0; i < 50; i++) {
      const line = sassLine(speaker, [speaker, genmate, target], () => (i % 10) / 10 + 0.05);
      expect(line.text).not.toContain("RealFriend");
      if (line.targetId) expect(line.targetId).toBe("t");
    }
  });
});
