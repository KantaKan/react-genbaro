import { describe, it, expect } from "vitest";
import { monthGrid } from "./calendar";
import type { AttendanceRecord } from "@/domain/types";

const rec = (date: string, session: "morning" | "afternoon", status: AttendanceRecord["status"]) => ({ date, session, status } as AttendanceRecord);

describe("monthGrid", () => {
  const cells = monthGrid(2026, 8, [rec("2026-09-01", "morning", "present"), rec("2026-09-01", "afternoon", "late")], "2026-09-08");
  const byDate = (d: string) => cells.find((c) => c.date === d)!;

  it("starts on Monday with blank leading cells (1 Sep 2026 is a Tuesday)", () => {
    expect(cells[0].date).toBeNull();
    expect(cells[1].date).toBe("2026-09-01");
  });
  it("flags weekends", () => {
    expect(byDate("2026-09-05").weekend).toBe(true);
    expect(byDate("2026-09-07").weekend).toBe(false);
  });
  it("uses records, marks past weekdays without records as none", () => {
    expect(byDate("2026-09-01")).toMatchObject({ am: "present", pm: "late" });
    expect(byDate("2026-09-04")).toMatchObject({ am: "none", pm: "none", future: false });
  });
  it("marks today and future days", () => {
    expect(byDate("2026-09-08").isToday).toBe(true);
    expect(byDate("2026-09-10")).toMatchObject({ future: true, am: null, pm: null });
  });
});
