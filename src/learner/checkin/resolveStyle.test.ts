import { describe, it, expect } from "vitest";
import { resolveStyle } from "./resolveStyle";

const prefs = (checkin_style: string, checkin_random = false) => ({ checkin_style, checkin_random });

describe("resolveStyle", () => {
  it("falls back to slide when the saved style is locked", () => expect(resolveStyle(prefs("rocket"), 3, false, "2026-09-08", "u1", 0).id).toBe("slide"));
  it("uses a free saved style", () => expect(resolveStyle(prefs("cat"), 0, false, "2026-09-08", "u1", 0).id).toBe("cat"));
  it("falls back to slide for unknown ids", () => expect(resolveStyle(prefs("xyz"), 0, false, "2026-09-08", "u1", 0).id).toBe("slide"));
  it("random mode is stable for a day and only picks unlocked styles", () => {
    const a = resolveStyle(prefs("", true), 3, false, "2026-09-08", "u1", 0);
    expect(resolveStyle(prefs("", true), 3, false, "2026-09-08", "u1", 0).id).toBe(a.id);
    expect(["rocket", "arcade", "dj", "gold"]).not.toContain(a.id);
  });

  it("random mode only deals Victory Lap to champions", () => {
    const picks = (champ: boolean) => Array.from({ length: 300 }, (_, i) => resolveStyle({ checkin_style: "", checkin_random: true }, 99, true, "2026-09-08", `s${i}`, 0, champ).id);
    expect(picks(false)).not.toContain("victory");
    expect(picks(true)).toContain("victory");
  });
  it("a saved Victory Lap falls back to Slide after the champion week", () => {
    expect(resolveStyle({ checkin_style: "victory", checkin_random: false }, 0, false, "2026-09-08", "s", 0, false).id).toBe("slide");
    expect(resolveStyle({ checkin_style: "victory", checkin_random: false }, 0, false, "2026-09-08", "s", 0, true).id).toBe("victory");
  });
});
