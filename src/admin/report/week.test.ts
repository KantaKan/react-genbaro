import { describe, it, expect } from "vitest";
import { mondayOf, shiftWeek, weekLabel } from "./week";

describe("week helpers", () => {
  it("finds the Monday of any day", () => {
    expect(mondayOf("2026-11-20")).toBe("2026-11-16"); // Friday
    expect(mondayOf("2026-11-16")).toBe("2026-11-16"); // Monday
    expect(mondayOf("2026-11-22")).toBe("2026-11-16"); // Sunday
    expect(mondayOf("2026-11-01")).toBe("2026-10-26"); // across a month
  });
  it("shifts by weeks across month and year ends", () => {
    expect(shiftWeek("2026-11-16", -1)).toBe("2026-11-09");
    expect(shiftWeek("2026-12-28", 1)).toBe("2027-01-04");
    expect(shiftWeek("2026-11-16", 0)).toBe("2026-11-16");
  });
  it("labels the week", () => {
    expect(weekLabel("2026-11-16")).toBe("16–20 Nov");
    expect(weekLabel("2026-10-26")).toBe("26–30 Oct");
    expect(weekLabel("2026-11-30")).toBe("30 Nov–4 Dec");
  });
});
