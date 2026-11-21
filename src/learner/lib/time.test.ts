import { describe, it, expect } from "vitest";
import { bangkokNow, phaseAt, sessionAt, minutesUntil, fmtClock } from "./time";
import type { CheckinRules } from "../types";

const rules: CheckinRules = {
  morning: { open_at: { h: 8, m: 30 }, late_after: { h: 9, m: 15 }, absent_after: { h: 10, m: 30 } },
  afternoon: { open_at: { h: 12, m: 30 }, late_after: { h: 13, m: 15 }, absent_after: { h: 14, m: 30 } },
};
const s = (h: number, m: number, sec = 0) => h * 3600 + m * 60 + sec;

describe("phaseAt (morning boundaries)", () => {
  it.each([
    [s(8, 29, 59), "not_open"],
    [s(8, 30), "on_time"],
    [s(9, 15), "on_time"],
    [s(9, 15, 1), "late"],
    [s(10, 30), "late"],
    [s(10, 30, 1), "closed"],
  ])("%i → %s", (now, want) => {
    expect(phaseAt(rules.morning, now)).toBe(want);
  });
});

describe("sessionAt", () => {
  it("is morning before the afternoon opens", () => expect(sessionAt(rules, s(11, 59))).toBe("morning"));
  it("is afternoon once it opens", () => expect(sessionAt(rules, s(12, 30))).toBe("afternoon"));
});

describe("bangkokNow", () => {
  it("converts UTC to Bangkok time", () => {
    expect(bangkokNow(new Date("2026-09-08T02:10:05Z"))).toEqual({ date: "2026-09-08", minutes: 550, seconds: 33005 });
  });
  it("rolls the date over at Bangkok midnight", () => {
    expect(bangkokNow(new Date("2026-09-08T17:30:00Z")).date).toBe("2026-09-09");
  });
});

describe("helpers", () => {
  it("minutesUntil rounds up and never goes negative", () => {
    expect(minutesUntil({ h: 9, m: 15 }, s(9, 8))).toBe(7);
    expect(minutesUntil({ h: 9, m: 15 }, s(9, 8, 30))).toBe(7);
    expect(minutesUntil({ h: 9, m: 15 }, s(9, 20))).toBe(0);
  });
  it("fmtClock pads minutes", () => expect(fmtClock({ h: 13, m: 5 })).toBe("13:05"));
});
