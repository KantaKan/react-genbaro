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
});
