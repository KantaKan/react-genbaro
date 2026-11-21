import { describe, it, expect } from "vitest";
import { leaveImpact, toLeavePayload } from "./leave";

describe("leaveImpact", () => {
  it("absent full day", () =>
    expect(leaveImpact("absent", "full", 2)).toBe("If approved, this counts as Absent · Excused and uses 1 of your 8 days. You'd have 5 left."));
  it("late morning", () =>
    expect(leaveImpact("late", "morning", 2)).toBe("If approved, this counts as Late · Excused for the morning and uses 1 of your 8 days. You'd have 5 left."));
  it("over the limit", () => expect(leaveImpact("absent", "full", 8)).toMatch(/You'd be over the limit — a TA will talk to you\.$/));
});

describe("toLeavePayload", () => {
  it("absent afternoon → half day", () =>
    expect(toLeavePayload("absent", "afternoon", "2026-09-17", "Doctor", "")).toEqual({ type: "half_day", session: "afternoon", date: "2026-09-17", reason: "Doctor" }));
  it("absent full day", () =>
    expect(toLeavePayload("absent", "full", "2026-09-17", "Family", "")).toEqual({ type: "full_day", date: "2026-09-17", reason: "Family" }));
  it("late keeps the session and appends a note", () =>
    expect(toLeavePayload("late", "morning", "2026-09-17", "Internet issues", "router died")).toEqual({
      type: "late",
      session: "morning",
      date: "2026-09-17",
      reason: "Internet issues — router died",
    }));
});
