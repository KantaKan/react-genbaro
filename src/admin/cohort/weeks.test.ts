import { describe, it, expect } from "vitest";
import { courseWeeks } from "./weeks";

describe("courseWeeks", () => {
  it("lists Mon–Fri course weeks up to today, newest first", () => {
    const w = courseWeeks("2026-06-29", "2026-07-15");
    expect(w).toEqual([
      { n: 3, from: "2026-07-13", to: "2026-07-17" },
      { n: 2, from: "2026-07-06", to: "2026-07-10" },
      { n: 1, from: "2026-06-29", to: "2026-07-03" },
    ]);
  });
  it("starts week 1 on the start date when the course begins mid-week", () => {
    expect(courseWeeks("2026-07-01", "2026-07-02")).toEqual([{ n: 1, from: "2026-07-01", to: "2026-07-03" }]);
    expect(courseWeeks("", "2026-07-02")).toEqual([]);
  });
});
