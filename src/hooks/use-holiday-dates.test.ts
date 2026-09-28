import { describe, expect, it } from "vitest";
import { expandHolidayDates } from "./use-holiday-dates";

describe("expandHolidayDates", () => {
  it("includes every Thailand calendar day in an admin holiday range", () => {
    const dates = expandHolidayDates([{ _id: "holiday-1", name: "Break", start_date: "2026-10-05", end_date: "2026-10-07", created_at: "", created_by: "" }]);

    expect([...dates].sort()).toEqual(["2026-10-05", "2026-10-06", "2026-10-07"]);
  });
});
