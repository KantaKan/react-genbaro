import { describe, it, expect } from "vitest";
import { weeksOf, isRough, isUnreplied, isMissing, matches } from "./days";
import type { OverviewDay } from "../../wellbeing";

const r = (zone: string, reply = "", improve = "") => ({ id: "r", zone, sent_at: "", tech_happy: "", tech_improve: improve, nontech_happy: "", nontech_improve: "", reply, reply_name: "", reply_at: null }) as OverviewDay["reflection"];
const day = (date: string, reflection: OverviewDay["reflection"] = null): OverviewDay => ({ date, morning: null, afternoon: null, reflection });

describe("days helpers", () => {
  it("groups by week, newest first, numbered from the first week", () => {
    const w = weeksOf([day("2026-11-16"), day("2026-11-20"), day("2026-11-23"), day("2026-11-26")]);
    expect(w.map((x) => x.label)).toEqual(["Week 2", "Week 1"]);
    expect(w[0].days.map((d) => d.date)).toEqual(["2026-11-26", "2026-11-23"]);
    expect(w[1].range).toBe("16-20 Nov");
  });
  it("classifies rows", () => {
    expect(isRough(day("d", r("panic")))).toBe(true);
    expect(isRough(day("d", r("comfort")))).toBe(false);
    expect(isUnreplied(day("d", r("comfort")))).toBe(true);
    expect(isUnreplied(day("d", r("comfort", "ok")))).toBe(false);
    expect(isMissing(day("d"))).toBe(true);
    expect(matches(day("d", r("comfort", "", "React Query")), "react")).toBe(true);
    expect(matches(day("d", r("comfort", "", "React Query")), "zod")).toBe(false);
  });
});
