import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { BoardPage, rankPosts } from "./BoardPage";
import { boardService } from "@/application/services/boardService";
import type { BoardPost } from "@/lib/board";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../api", () => ({ learnerApi: { getCohortPeople: vi.fn().mockResolvedValue([{ _id: "u", first_name: "Ajjima", avatar: { style: "lorelei", seed: "q", bg: "e0e7ff" } }]) } }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "A", zoom_name: "03_A(Black/แบล็ค)", cohort_number: 13 }, loading: false }) }));
const post = (id: string, reactions: number, comments: number, createdAt: string): BoardPost =>
  ({ id, userId: "u", zoomName: "01_Ajjima(Theim/เถียม)", cohort: 13, content: `post ${id}`, createdAt, reactions: Array.from({ length: reactions }, (_, i) => ({ id: `${id}r${i}`, userId: `x${i}`, type: "image", value: "peepolike" })), comments: Array.from({ length: comments }, () => ({})) } as BoardPost);
const { posts } = vi.hoisted(() => ({ posts: { list: [] as BoardPost[] } }));
vi.mock("@/application/services/boardService", () => ({
  boardService: { getPosts: vi.fn(() => Promise.resolve(posts.list)), createPost: vi.fn().mockResolvedValue({}), addReaction: vi.fn().mockResolvedValue({}), removeReaction: vi.fn().mockResolvedValue({}) },
}));

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <BoardPage />
      </MemoryRouter>
    </QueryClientProvider>
  );

describe("BoardPage", () => {
  beforeEach(() => {
    posts.list = [post("a", 1, 0, "2026-09-08T03:00:00Z"), post("b", 5, 3, "2026-09-07T03:00:00Z")];
    vi.mocked(boardService.createPost).mockClear();
    vi.mocked(boardService.addReaction).mockClear();
    vi.mocked(boardService.removeReaction).mockClear();
  });

  it("ranks popular posts by reactions + comments", () => {
    expect(rankPosts(posts.list, "popular").map((p) => p.id)).toEqual(["b", "a"]);
    expect(rankPosts(posts.list, "latest").map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("posts once and clears the composer", async () => {
    renderPage();
    const box = await screen.findByPlaceholderText("Share something with your cohort…");
    fireEvent.change(box, { target: { value: "Hello JSD13" } });
    fireEvent.click(screen.getByRole("button", { name: "Post" }));
    fireEvent.click(screen.getByRole("button", { name: "Post" }));
    await waitFor(() => expect(boardService.createPost).toHaveBeenCalledTimes(1));
    expect(boardService.createPost).toHaveBeenCalledWith({ content: "Hello JSD13", zoomName: "03_A(Black/แบล็ค)", cohort: 13 });
    await waitFor(() => expect(box).toHaveValue(""));
  });

  it("toggles my reaction", async () => {
    renderPage();
    const card = (await screen.findByText("post a")).closest("article")!;
    fireEvent.click(within(card).getByRole("button", { name: /React with peepoheart/ }));
    await waitFor(() => expect(boardService.addReaction).toHaveBeenCalledWith({ postId: "a", reaction: "peepoheart" }));
  });

  it("shows each author's saved avatar", async () => {
    renderPage();
    const card = (await screen.findByText("post a")).closest("article")!;
    await waitFor(() => expect(card.querySelector("img[data-avatar='dicebear']")).not.toBeNull());
  });
});
