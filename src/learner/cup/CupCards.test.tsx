import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { LeaderboardCard } from "./LeaderboardCard";
import { YourGroupCard } from "./YourGroupCard";
import type { GroupScore, MyCup } from "./types";

const g = (group: string, coding: number, soft: number, showing_up: number, helping: number): GroupScore => ({
  group, total: coding + soft + showing_up + helping, by_category: { coding, soft, showing_up, helping }, by_day: [10, 20, 0, 0, 0],
});
const cup = (my: string, standings: GroupScore[]): MyCup => ({
  week: "2026-09-07", week_no: 10, ends_at: "2026-09-11T09:45:00Z", standings, my_group: my,
  my_awards: [{ id: "1", group: "F", category: "coding", points: 20, reason: "Mini-project demo", day: "2026-09-08", created_at: "2026-09-08T05:00:00Z" }],
  champion_group: "", my_medals: [], wall_of_fame: [],
});
const now = new Date("2026-09-08T05:00:00Z");
const S = [g("C", 30, 20, 15, 17), g("F", 10, 24, 30, 0), g("A", 5, 5, 0, 0), g("B", 1, 0, 0, 0)];

describe("LeaderboardCard", () => {
  it("shows the top 3 only, never last place", () => {
    render(<LeaderboardCard cup={cup("F", S)} now={now} />);
    const podium = screen.getByRole("list", { name: "Top 3" });
    expect(within(podium).getAllByRole("listitem").map((li) => li.getAttribute("data-group"))).toEqual(["F", "C", "A"]); // 2-1-3 order
    expect(screen.queryByText("Group B")).toBeNull();
    expect(screen.getByText(/GenMate Cup · Week 10/)).toBeInTheDocument();
    expect(screen.getByText(/ends in/)).toBeInTheDocument();
  });
  it("renders an empty week", () => {
    render(<LeaderboardCard cup={cup("F", [g("A", 0, 0, 0, 0), g("F", 0, 0, 0, 0)])} now={now} />);
    expect(screen.getByText(/No points yet this week/)).toBeInTheDocument();
  });
});

describe("YourGroupCard", () => {
  it("shows the headline, best move and recent awards", () => {
    render(<YourGroupCard cup={cup("F", S)} />);
    expect(screen.getByText("19 points to pass Group C. You're #2 with 64.")).toBeInTheDocument();
    expect(screen.getByText(/Ship a solid mini-project demo/)).toBeInTheDocument();
    expect(screen.getByText("Mini-project demo")).toBeInTheDocument();
    expect(screen.getByText("lowest")).toBeInTheDocument();
  });
  it("handles a learner without a group", () => {
    render(<YourGroupCard cup={cup("", S)} />);
    expect(screen.getByText("You're not in a GenMate group yet.")).toBeInTheDocument();
  });
});
