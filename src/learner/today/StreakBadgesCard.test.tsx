import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { StreakBadgesCard } from "./StreakBadgesCard";
import type { Badge } from "@/domain/types";

vi.mock("framer-motion", async (o) => ({ ...(await o<object>()) }));

const badge = (name: string, awardedAt: string, o: Partial<Badge> = {}): Badge => ({ type: "custom", name, emoji: "⭐", awardedAt, ...o });
const renderCard = (badges: Badge[]) =>
  render(
    <MemoryRouter>
      <StreakBadgesCard streak={4} badges={badges} perfectWeek={false} weekOnTime={3} />
    </MemoryRouter>
  );

describe("StreakBadgesCard", () => {
  it("a zero on-time streak is a quiet fresh start, not a big 0", () => {
    render(
      <MemoryRouter>
        <StreakBadgesCard streak={0} badges={[]} perfectWeek={false} weekOnTime={0} />
      </MemoryRouter>
    );
    expect(screen.queryByText("0-day streak")).not.toBeInTheDocument();
    expect(screen.getByText(/A fresh start at your next check-in/)).toBeInTheDocument();
  });

  it("shows the real badges, newest first, with their emoji or picture", () => {
    renderCard([
      badge("First week", "2026-07-03T00:00:00Z", { emoji: "🌱" }),
      badge("Bug hunter", "2026-08-20T00:00:00Z", { emoji: "🐛" }),
      badge("Demo star", "2026-09-01T00:00:00Z", { emoji: "", imageUrl: "https://example.com/star.png", style: "image" }),
    ]);
    const names = screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"));
    expect(names.slice(1, 4)).toEqual(["Demo star", "Bug hunter", "First week"]);
    expect(screen.getByText("🐛")).toBeInTheDocument();
    expect(document.querySelector('image[href="https://example.com/star.png"]')).not.toBeNull();
  });

  it("links to every badge when there are more than fit", () => {
    renderCard(Array.from({ length: 9 }, (_, i) => badge(`Badge ${i}`, `2026-08-${String(10 + i).padStart(2, "0")}T00:00:00Z`)));
    expect(screen.getByRole("link", { name: "See all 9 badges" })).toHaveAttribute("href", "/learner/my-profile");
    expect(screen.getAllByRole("button")).toHaveLength(8); // streak + 7 newest
  });

  it("invites you to earn one when there are none yet", () => {
    renderCard([]);
    expect(screen.getByText("Badges you earn show up here.")).toBeInTheDocument();
  });
});
