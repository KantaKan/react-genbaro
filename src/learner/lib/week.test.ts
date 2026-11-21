import { describe, it, expect } from "vitest";
import { weekCells } from "./week";
import type { AttendanceRecord } from "@/domain/types";

const rec = (date: string, session: "morning" | "afternoon", status: AttendanceRecord["status"]) =>
  ({ date, session, status } as AttendanceRecord);

describe("weekCells", () => {
  it("builds Mon–Fri of the current week with AM/PM statuses", () => {
    const cells = weekCells(
      [rec("2026-09-07", "morning", "present"), rec("2026-09-07", "afternoon", "present"), rec("2026-09-08", "morning", "late")],
      "2026-09-08"
    );
    expect(cells.map((c) => [c.label, c.day])).toEqual([["Mon", 7], ["Tue", 8], ["Wed", 9], ["Thu", 10], ["Fri", 11]]);
    expect(cells[0]).toMatchObject({ am: "present", pm: "present", isToday: false, future: false });
    expect(cells[1]).toMatchObject({ am: "late", pm: null, isToday: true, future: false });
    expect(cells[2]).toMatchObject({ future: true, am: null });
  });
  it("works when today is a Sunday (shows the week that just ended)", () => {
    const cells = weekCells([], "2026-09-13");
    expect(cells[0].date).toBe("2026-09-07");
    expect(cells.every((c) => !c.future)).toBe(true);
  });
});
