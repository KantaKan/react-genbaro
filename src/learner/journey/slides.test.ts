import { describe, it, expect } from "vitest";
import { slidesFor } from "./slideOrder";
import type { Journey, Extras } from "./types";

const none: Extras = { cupMedals: 0, baroName: null, hideNight: false };
const full: Journey = {
  unlocked: true, name: "Fern", written: 30, class_days: 40, main_zone: "comfort",
  hardest_week: { number: 3, from: "a", to: "b", zones: [] },
  darkest_night: { date: "d", zone: "panic", text: "t", reply: "r", reply_name: "Nan" },
  comeback: { length: 9, after_darkest: true }, attendance_rate: 0.9, badges: 2, ta_replies: 4,
  quote: { reflection_id: "x", date: "d", text: "q" },
};

describe("slidesFor", () => {
  it("shows the whole story when everything is there", () => {
    expect(slidesFor(full, none)).toEqual(["cover", "grid", "zone", "week", "night", "comeback", "tiles", "closing"]);
  });
  it("is empty while locked", () => {
    expect(slidesFor({ unlocked: false }, none)).toEqual([]);
  });
  it("skips the hard week and night when there were none", () => {
    expect(slidesFor({ ...full, hardest_week: null, darkest_night: null, comeback: { length: 6, after_darkest: false } }, none)).toEqual(["cover", "grid", "zone", "comeback", "tiles", "closing"]);
  });
  it("lets the learner hide the darkest night", () => {
    expect(slidesFor(full, { ...none, hideNight: true })).not.toContain("night");
  });
  it("skips the tiles slide when every tile is empty", () => {
    expect(slidesFor({ ...full, attendance_rate: null, badges: 0, ta_replies: 0 }, none)).not.toContain("tiles");
    expect(slidesFor({ ...full, attendance_rate: null, badges: 0, ta_replies: 0 }, { ...none, cupMedals: 1 })).toContain("tiles");
  });
  it("keeps only cover, grid and closing under 5 nights", () => {
    expect(slidesFor({ ...full, written: 3 }, none)).toEqual(["cover", "grid", "closing"]);
    expect(slidesFor({ ...full, written: 0, quote: null }, none)).toEqual(["cover", "grid"]);
  });
});
