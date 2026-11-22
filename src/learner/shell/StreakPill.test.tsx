import { describe, expect, it } from "vitest";
import { streakPill } from "./StreakPill";

describe("streakPill", () => {
  it("celebrates once tonight's reflection is in", () => {
    expect(streakPill({ streak: 12, writtenToday: true, open: true })).toEqual({ count: 12, text: "12-night streak", tone: "done" });
  });
  it("nudges after 16:45 when tonight's is still missing", () => {
    expect(streakPill({ streak: 12, writtenToday: false, open: true })).toEqual({ count: 12, text: "12 nights · write tonight to keep it", tone: "due" });
  });
  it("stays calm before reflections open", () => {
    expect(streakPill({ streak: 1, writtenToday: false, open: false })).toEqual({ count: 1, text: "1-night streak", tone: "calm" });
  });
  it("invites a new streak at zero", () => {
    expect(streakPill({ streak: 0, writtenToday: false, open: true })).toEqual({ count: 0, text: "Start a streak tonight", tone: "due" });
    expect(streakPill({ streak: 0, writtenToday: false, open: false })).toEqual({ count: 0, text: "Start a streak tonight", tone: "calm" });
  });
});
