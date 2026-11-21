import { describe, it, expect, beforeEach, vi } from "vitest";
import { styleUnlocked, unlockProgress, dailyStyle, readReroll, bumpReroll } from "./unlock";
import { styleById, STYLES, type StyleId } from "./registry";

const m = (id: string) => styleById(id)!;

describe("styleUnlocked", () => {
  it.each([
    ["slide", 0, false, true],
    ["rocket", 14, false, false],
    ["rocket", 15, false, true],
    ["arcade", 19, false, false],
    ["arcade", 20, false, true],
    ["dj", 29, false, false],
    ["dj", 30, false, true],
    ["gold", 99, false, false],
    ["gold", 0, true, true],
  ] as const)("%s streak=%i perfect=%s → %s", (id, streak, perfect, want) => {
    expect(styleUnlocked(m(id), streak, perfect)).toBe(want);
  });
  it("lists the 16 styles in order", () => {
    expect(STYLES.map((s) => s.id).join(" ")).toBe("slide hold ring run coffee red cat bubble scratch alarm slot gacha rocket gold arcade dj");
  });
});

describe("unlockProgress", () => {
  it("reports streak progress", () => expect(unlockProgress(m("rocket"), 12)).toEqual({ have: 12, need: 15 }));
  it("is null for free styles", () => expect(unlockProgress(m("cat"), 3)).toBeNull());
});

describe("dailyStyle", () => {
  const ids: StyleId[] = ["slide", "hold", "ring", "run", "coffee", "red", "cat"];
  it("is stable for the same day", () => {
    expect(dailyStyle(ids, "2026-09-08", "u1", 0)).toBe(dailyStyle(ids, "2026-09-08", "u1", 0));
    expect(ids).toContain(dailyStyle(ids, "2026-09-08", "u1", 0));
  });
  it("a reroll changes it for most learners", () => {
    const changed = Array.from({ length: 20 }, (_, i) => `u${i}`).filter((u) => dailyStyle(ids, "2026-09-08", u, 0) !== dailyStyle(ids, "2026-09-08", u, 1));
    expect(changed.length).toBeGreaterThan(0);
  });
  it("one option means that option", () => expect(dailyStyle(["slide"], "2026-09-08", "u1", 3)).toBe("slide"));
});

describe("reroll counter", () => {
  beforeEach(() => {
    // Node 26 shadows jsdom's localStorage; use an in-memory one.
    const m = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), clear: () => m.clear() });
  });
  it("counts per day and resets on a new day", () => {
    expect(readReroll("2026-09-08")).toBe(0);
    bumpReroll("2026-09-08");
    expect(readReroll("2026-09-08")).toBe(1);
    expect(readReroll("2026-09-09")).toBe(0);
  });
});
