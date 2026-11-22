import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { BoardLatestCard } from "./BoardLatestCard";
import { getPosts } from "@/application/services/boardService";
import type { BoardComment, BoardPost } from "@/lib/board";

vi.mock("@/application/services/boardService", () => ({ getPosts: vi.fn() }));

const reply = (id: string, who: string, content: string, at: string, reactions = 0): BoardComment => ({
  id,
  userId: id,
  zoomName: `0_${who}(${who}/${who})`,
  cohort: 13,
  content,
  createdAt: at,
  reactions: Array.from({ length: reactions }, (_, i) => ({ id: `${id}-${i}`, userId: `x${i}`, type: "image" as const, value: "peepoheart" })),
});
const post = (id: string, content: string, at: string, comments: BoardComment[] = []): BoardPost => ({ id, userId: "u", zoomName: "01_Mint(Mint/มิ้นท์)", cohort: 13, content, reactions: [], comments, createdAt: at });

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <BoardLatestCard />
      </MemoryRouter>
    </QueryClientProvider>
  );

describe("BoardLatestCard", () => {
  beforeEach(() =>
    vi.mocked(getPosts).mockResolvedValue([
      post("p1", "Anyone stuck on useEffect?", "2026-11-22T03:00:00Z", [
        reply("c1", "Fah", "Return a cleanup function!", "2026-11-22T03:05:00Z", 3),
        reply("c2", "Non", "same here", "2026-11-22T03:20:00Z", 0),
      ]),
      post("p2", "Lunch spot ideas?", "2026-11-22T02:00:00Z", [reply("c3", "Ploy", "Noodles near BTS", "2026-11-22T02:10:00Z"), reply("c4", "Dear", "Pizza!!", "2026-11-22T02:30:00Z")]),
      post("p3", "Meme of the day", "2026-11-22T01:00:00Z"),
    ])
  );

  it("shows the reply people liked most under a post", async () => {
    renderCard();
    const p1 = (await screen.findByText("Anyone stuck on useEffect?")).closest("li")!;
    expect(within(p1).getByText("Top reply")).toBeInTheDocument();
    expect(within(p1).getByText("Return a cleanup function!")).toBeInTheDocument();
    expect(within(p1).queryByText("same here")).toBeNull();
  });

  it("otherwise shows the latest reply", async () => {
    renderCard();
    const p2 = (await screen.findByText("Lunch spot ideas?")).closest("li")!;
    expect(within(p2).getByText("Latest reply")).toBeInTheDocument();
    expect(within(p2).getByText("Pizza!!")).toBeInTheDocument();
  });

  it("shows no reply line for a post without replies", async () => {
    renderCard();
    const p3 = (await screen.findByText("Meme of the day")).closest("li")!;
    expect(within(p3).queryByText(/reply$/)).toBeNull();
  });
});
