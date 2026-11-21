import { describe, expect, it } from "vitest";
import type { StartupDev } from "@/application/services/startupStoryService";
import { assignStations, deskSlots, levelUps, ROOM_H, ROOM_W, standupSpots, stations } from "./officeLayout";

const dev = (id: string, role?: string, level?: number): StartupDev => ({ id, name: id, title: "", sprite: "dev", role, level, frontend: 1, backend: 1, design: 1, debug: 1, salary: 0 });

describe("assignStations", () => {
  it("sends support roles to their wall station and builders to desks", () => {
    const placed = assignStations([dev("a", "fe_dev"), dev("p", "po"), dev("m", "pm"), dev("s", "sa"), dev("o", "devops")]);
    expect(placed.get("p")?.kind).toBe("sticky");
    expect(placed.get("m")?.kind).toBe("kanban");
    expect(placed.get("s")?.kind).toBe("whiteboard");
    expect(placed.get("o")?.kind).toBe("rack");
    expect(placed.get("a")?.kind).toBe("desk");
  });

  it("gives a second PM a desk instead of sharing the kanban board", () => {
    const placed = assignStations([dev("m1", "pm"), dev("m2", "pm")]);
    expect(placed.get("m1")?.kind).toBe("kanban");
    expect(placed.get("m2")?.kind).toBe("desk");
  });

  it("fits the endless-mode team cap of 8 with every spot inside the room", () => {
    const team = Array.from({ length: 8 }, (_, i) => dev(`d${i}`, "fe_dev"));
    const placed = assignStations(team, Array(8).fill(1));
    expect(placed.size).toBe(8);
    for (const s of [...stations.map((st) => st.spot), ...standupSpots(8)]) {
      expect(s.x).toBeGreaterThan(0);
      expect(s.x).toBeLessThan(ROOM_W);
      expect(s.y).toBeLessThan(ROOM_H);
    }
  });
});

describe("desks", () => {
  it("seats builders at the best desks first", () => {
    const placed = assignStations([dev("a", "fe_dev"), dev("b", "be_dev")], [1, 3, 2]);
    expect(placed.get("a")?.id).toBe("desk-2");
    expect(placed.get("b")?.id).toBe("desk-3");
  });

  it("shows owned desks plus open slots up to this act's limit", () => {
    expect(deskSlots([2, 1], 4).map((d) => d.tier)).toEqual([2, 1, 0, 0]);
    expect(deskSlots([1, 1], 2)).toHaveLength(2);
  });
});

describe("levelUps", () => {
  it("reports only people whose level went up since last time", () => {
    const before = new Map([["a", 1], ["b", 2]]);
    expect(levelUps(before, [dev("a", "fe_dev", 2), dev("b", "be_dev", 2), dev("new", "qa", 3)])).toEqual(["a"]);
  });
});
