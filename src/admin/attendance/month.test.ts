import { describe, it, expect } from "vitest";
import { attendedRate, dayStats, monthMondays, shiftMonth } from "./month";
import { sortLearners, matchLearner } from "./sortLearners";
import type { RegisterLearner, RegisterView } from "../types";

const cell = (status: string) => ({ status, checked_in_at: null }) as never;
const learner = (id: string, o: Partial<RegisterLearner> = {}): RegisterLearner =>
  ({ id, first_name: id, last_name: "", zoom_name: id, jsd_number: "1", genmate_group: "A", days: [], week_rate: 0, leave_used: 0, ...o }) as RegisterLearner;

describe("month helpers", () => {
  it("lists the Mondays of every week that touches the month", () => {
    expect(monthMondays("2026-09")).toEqual(["2026-08-31", "2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28"]);
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("counts a day from marked sessions only, so unmarked ones don't read as absences", () => {
    const v = {
      week: "2026-09-07", dates: ["2026-09-07"], holidays: [], kpis: {} as never, previous: {} as never,
      learners: [learner("a", { days: [[cell("present"), cell("late")]] }), learner("b", { days: [[cell("absent_excused"), cell("")]] })],
    } as RegisterView;
    const s = dayStats([v]).get("2026-09-07")!;
    expect(s).toMatchObject({ present: 1, late: 1, excused: 1, absent: 0, unmarked: 1 });
    expect(attendedRate(s)).toBeCloseTo(2 / 3);
    expect(attendedRate({ ...s, present: 0, late: 0, excused: 0 })).toBeNull();
  });
});

describe("register sorting", () => {
  const list = [
    learner("Mint", { jsd_number: "3", genmate_group: "B", week_rate: 0.5, leave_used: 4 }),
    learner("Arm", { jsd_number: "1", genmate_group: "C", week_rate: 1, leave_used: 0 }),
    learner("Bank", { jsd_number: "2", genmate_group: "A", week_rate: 0.8, leave_used: 7 }),
  ];
  it("sorts by any column, both ways", () => {
    expect(sortLearners(list, "name", "asc").map((l) => l.id)).toEqual(["Arm", "Bank", "Mint"]);
    expect(sortLearners(list, "week", "asc").map((l) => l.id)).toEqual(["Mint", "Bank", "Arm"]);
    expect(sortLearners(list, "leave", "desc").map((l) => l.id)).toEqual(["Bank", "Mint", "Arm"]);
    expect(sortLearners(list, "group", "asc").map((l) => l.id)).toEqual(["Bank", "Mint", "Arm"]);
  });
  it("searches name and number", () => {
    expect(matchLearner(list[0], "min")).toBe(true);
    expect(matchLearner(list[0], "3")).toBe(true);
    expect(matchLearner(list[0], "zzz")).toBe(false);
  });
});
