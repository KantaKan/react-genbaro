import { describe, expect, it } from "vitest";
import type { StartupDev } from "@/application/services/startupStoryService";
import { roleLook, teamHints } from "./startupStoryCatalog";

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
