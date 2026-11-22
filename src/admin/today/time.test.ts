import { describe, it, expect } from "vitest";
import { currentSession, liveInterval } from "./time";

const rules = { morning: { open_at: { h: 8, m: 30 }, late_after: { h: 9, m: 15 }, absent_after: { h: 10, m: 30 } }, afternoon: { open_at: { h: 12, m: 30 }, late_after: { h: 13, m: 15 }, absent_after: { h: 14, m: 30 } } };

describe("live board timing (from the client clock, not the last fetch)", () => {
  it("polls in the afternoon window", () => expect(liveInterval(rules, 13 * 60, true)).toBe(15_000));
  it("polls in the morning window", () => expect(liveInterval(rules, 9 * 60, true)).toBe(15_000));
  it("is quiet at lunch and on days off", () => {
    expect(liveInterval(rules, 11 * 60 + 30, true)).toBe(60_000);
    expect(liveInterval(rules, 9 * 60, false)).toBe(60_000);
  });
  it("switches to the afternoon at its open time", () => {
    expect(currentSession(rules, 12 * 60 + 29)).toBe("morning");
    expect(currentSession(rules, 12 * 60 + 30)).toBe("afternoon");
  });
});
