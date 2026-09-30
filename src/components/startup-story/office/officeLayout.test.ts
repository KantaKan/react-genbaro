import { describe, expect, it } from "vitest";
import type { StartupDev } from "@/application/services/startupStoryService";
import { assignStations, levelUps, ROOM_H, ROOM_W, standupSpots, stations } from "./officeLayout";

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
    const placed = assignStations(team);
    expect(placed.size).toBe(8);
    for (const s of [...stations.map((st) => st.spot), ...standupSpots(8)]) {
      expect(s.x).toBeGreaterThan(0);
      expect(s.x).toBeLessThan(ROOM_W);
      expect(s.y).toBeLessThan(ROOM_H);
    }
  });
});

describe("levelUps", () => {
  it("reports only people whose level went up since last time", () => {
    const before = new Map([["a", 1], ["b", 2]]);
    expect(levelUps(before, [dev("a", "fe_dev", 2), dev("b", "be_dev", 2), dev("new", "qa", 3)])).toEqual(["a"]);
  });
});
