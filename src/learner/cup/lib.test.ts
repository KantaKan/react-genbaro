import { describe, it, expect } from "vitest";
import { headline, bestMoves, moments, weekProgress, CATEGORY_LABEL } from "./lib";
import type { GroupScore, MyCup } from "./types";

const g = (group: string, coding: number, soft: number, showing_up: number, helping: number, by_day = [0, 0, 0, 0, 0]): GroupScore => ({
  group, total: coding + soft + showing_up + helping, by_category: { coding, soft, showing_up, helping }, by_day,
});
const cup = (my: string, standings: GroupScore[]): MyCup => ({
  week: "2026-09-07", week_no: 10, ends_at: "2026-09-11T09:45:00Z", standings, my_group: my, my_awards: [], champion_group: "", my_medals: [], wall_of_fame: [],
});
const S = [g("C", 30, 20, 15, 17), g("F", 10, 24, 30, 0), g("A", 5, 5, 0, 0)];

describe("cup helpers", () => {
  it("headline when chasing", () => expect(headline(cup("F", S))).toBe("19 points to pass Group C. You're #2 with 64."));
  it("headline when leading", () => expect(headline(cup("C", S))).toBe("You're leading. 18 points ahead."));
  it("headline without a group", () => expect(headline(cup("", S))).toBe("You're not in a GenMate group yet."));
  it("headline when tied for first", () => expect(headline(cup("B", [g("A", 10, 0, 0, 0), g("B", 0, 10, 0, 0)]))).toBe("Tied on 10 with Group A. Coding points break the tie."));
  it("best move targets my weakest category against #1", () => {
    const m = bestMoves(cup("F", S));
    expect(m[0].category).toBe("coding"); // 10 vs 30 → biggest gap
    expect(m).toHaveLength(3);
  });
  it("best move compares with #2 when leading", () => expect(bestMoves(cup("C", S))[0].category).toBe("showing_up")); // 15 vs 30
  it("moments are positive, max 3", () => {
    const m = moments([g("C", 0, 0, 45, 0, [15, 15, 15, 0, 0]), g("F", 30, 0, 0, 0, [0, 0, 30, 0, 0])], 2);
    expect(m.length).toBeLessThanOrEqual(3);
    expect(m.join(" ")).toMatch(/Group C was on time together 3 days/);
    expect(m.join(" ")).toMatch(/Group F jumped \+30 today/);
  });
  it("empty week has no moments", () => expect(moments([g("A", 0, 0, 0, 0)], 0)).toEqual([]));
  it("week progress", () => {
    const p = weekProgress(new Date("2026-09-09T05:00:00Z"), "2026-09-07", "2026-09-11T09:45:00Z");
    expect(p.pct).toBeGreaterThan(0.4);
    expect(p.pct).toBeLessThan(0.6);
    expect(p.left).toBe("ends in 2d 4h");
  });
  it("labels", () => expect(CATEGORY_LABEL.soft).toBe("Soft skills"));
});
