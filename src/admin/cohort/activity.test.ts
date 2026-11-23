import { describe, it, expect } from "vitest";
import { factLine, forWhom } from "./activity";

describe("activity wording", () => {
  it("names who a change was for", () => {
    expect(forWhom(["Mint"])).toBe("Mint");
    expect(forWhom(["Mint", "Ploy"])).toBe("Mint and Ploy");
    expect(forWhom(["Mint", "Ploy", "Bank", "Fah"])).toBe("Mint, Ploy and 2 more");
  });

  it("turns the kept facts into a short phrase", () => {
    expect(factLine({ date: "2026-11-24", session: "morning", status: "absent_excused" })).toBe("Tue 24 Nov, morning → excused");
    expect(factLine({ points: "15", group: "G2" })).toBe("15 pts to G2");
    expect(factLine(undefined)).toBe("");
  });
});
