import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import { renderAdmin } from "../test-setup";
import { AdminBoardPage } from "./BoardPage";
import { boardService } from "@/application/services/boardService";
import { adminApi } from "../api";
import type { BoardPost } from "@/lib/board";

vi.mock("@blobatar/react/gaze", () => ({ useGaze: () => ({ ref: vi.fn() }) }));
vi.mock("@/components/mode-toggle", () => ({ ModeToggle: () => null }));
vi.mock("sonner", () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }), Toaster: () => null }));
vi.mock("@/application/contexts/AuthContext", () => ({ useAuth: () => ({ logout: vi.fn(), userRole: "admin" }) }));
vi.mock("@/UserDataContext", () => ({ useUserData: () => ({ userData: { _id: "me", first_name: "Kan", zoom_name: "00_Kan(Kan/กัน)", cohort_number: 13 }, loading: false }) }));
vi.mock("../wellbeing", async (o) => ({ ...(await o<object>()), wellbeingApi: { support: vi.fn().mockResolvedValue([]) } }));
vi.mock("../api", () => ({ adminApi: { leaves: vi.fn().mockResolvedValue([]), me: vi.fn(), cohorts: vi.fn().mockRejectedValue(new Error("x")) } }));
vi.mock("@/application/services/boardService", () => ({ boardService: { getCohortPosts: vi.fn(), createPost: vi.fn(), createComment: vi.fn(), deletePost: vi.fn(), deleteComment: vi.fn() } }));

const post = (id: string, content: string, createdAt: string, o: Partial<BoardPost> = {}): BoardPost => ({
  id,
  userId: `u-${id}`,
  zoomName: `01_Mint(Mint/มิ้นท์)`,
  cohort: 13,
  content,
  reactions: [],
  comments: [],
  createdAt,
  ...o,
});
const me = (role: string) => vi.mocked(adminApi.me).mockResolvedValue({ id: "me", first_name: "Kan", staff_role: role, cohorts: [13], groups: [] } as never);

describe("AdminBoardPage", () => {
  beforeEach(() => {
    me("owner");
    vi.mocked(boardService.getCohortPosts).mockReset().mockResolvedValue([
      post("p1", "Anyone stuck on useEffect?", "2026-11-22T02:00:00Z", {
        comments: [
          { id: "c1", userId: "u2", zoomName: "02_Fah(Fah/ฟ้า)", cohort: 13, content: "Me! The cleanup part", reactions: [], createdAt: "2026-11-22T02:10:00Z" },
          { id: "c2", userId: "u3", zoomName: "03_Non(Non/นนท์)", cohort: 13, content: "spam spam", reactions: [], createdAt: "2026-11-22T02:20:00Z" },
        ],
      }),
      post("p2", "Meme of the day", "2026-11-22T03:00:00Z", { reactions: [{ id: "r1", userId: "u2", type: "image", value: "pepelaugh" }, { id: "r2", userId: "u3", type: "image", value: "pepelaugh" }] }),
    ]);
    vi.mocked(boardService.createPost).mockReset().mockResolvedValue({});
    vi.mocked(boardService.createComment).mockReset().mockResolvedValue({});
    vi.mocked(boardService.deletePost).mockReset().mockResolvedValue(undefined);
    vi.mocked(boardService.deleteComment).mockReset().mockResolvedValue(undefined);
  });

  it("shows the selected cohort's posts, newest first", async () => {
    renderAdmin(<AdminBoardPage />, "/admin/board");
    const posts = await screen.findAllByRole("article");
    expect(boardService.getCohortPosts).toHaveBeenCalledWith(13);
    expect(within(posts[0]).getByText("Meme of the day")).toBeInTheDocument();
    expect(within(posts[1]).getByText("2 replies")).toBeInTheDocument();
  });

  it("opens replies and removes one after confirming", async () => {
    renderAdmin(<AdminBoardPage />, "/admin/board");
    const p1 = (await screen.findByText("Anyone stuck on useEffect?")).closest("article")!;
    fireEvent.click(within(p1).getByRole("button", { name: "2 replies" }));
    expect(within(p1).getByText("Me! The cleanup part")).toBeInTheDocument();
    fireEvent.click(within(p1).getByRole("button", { name: "Delete reply by นนท์" }));
    const ok = await screen.findByRole("button", { name: "Confirm" });
    fireEvent.click(ok);
    fireEvent.click(ok);
    await waitFor(() => expect(boardService.deleteComment).toHaveBeenCalledTimes(1));
    expect(boardService.deleteComment).toHaveBeenCalledWith("p1", "c2");
  });

  it("removes a post after confirming", async () => {
    renderAdmin(<AdminBoardPage />, "/admin/board");
    const p2 = (await screen.findByText("Meme of the day")).closest("article")!;
    fireEvent.click(within(p2).getByRole("button", { name: "Delete post by มิ้นท์" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(boardService.deletePost).toHaveBeenCalledWith("p2"));
  });

  it("posts to the cohort once", async () => {
    renderAdmin(<AdminBoardPage />, "/admin/board");
    fireEvent.change(await screen.findByLabelText("Post to JSD13"), { target: { value: "Retro at 15:00 today" } });
    const b = screen.getByRole("button", { name: "Post" });
    fireEvent.click(b);
    fireEvent.click(b);
    await waitFor(() => expect(boardService.createPost).toHaveBeenCalledTimes(1));
    expect(boardService.createPost).toHaveBeenCalledWith({ content: "Retro at 15:00 today", zoomName: "00_Kan(Kan/กัน)", cohort: 13 });
  });

  it("popular puts the most reacted post first", async () => {
    vi.mocked(boardService.getCohortPosts).mockResolvedValue([
      post("old", "Popular one", "2026-11-20T02:00:00Z", { reactions: [{ id: "a", userId: "1", type: "image", value: "sadge" }, { id: "b", userId: "2", type: "image", value: "sadge" }] }),
      post("new", "Fresh one", "2026-11-22T02:00:00Z"),
    ]);
    renderAdmin(<AdminBoardPage />, "/admin/board");
    expect(within((await screen.findAllByRole("article"))[0]).getByText("Fresh one")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Popular" }));
    expect(within(screen.getAllByRole("article")[0]).getByText("Popular one")).toBeInTheDocument();
  });

  it("a viewer can read but not post or delete", async () => {
    me("viewer");
    renderAdmin(<AdminBoardPage />, "/admin/board");
    await screen.findByText("Meme of the day");
    await waitFor(() => expect(screen.queryByLabelText("Post to JSD13")).toBeNull());
    expect(screen.queryByRole("button", { name: /Delete post/ })).toBeNull();
  });

  it("replies to a post once", async () => {
    renderAdmin(<AdminBoardPage />, "/admin/board");
    const p1 = (await screen.findByText("Anyone stuck on useEffect?")).closest("article")!;
    fireEvent.click(within(p1).getByRole("button", { name: "2 replies" }));
    fireEvent.change(within(p1).getByLabelText("Reply to this post"), { target: { value: "Try the cleanup return" } });
    const send = within(p1).getByRole("button", { name: "Reply" });
    fireEvent.click(send);
    fireEvent.click(send);
    await waitFor(() => expect(boardService.createComment).toHaveBeenCalledTimes(1));
    expect(boardService.createComment).toHaveBeenCalledWith({ postId: "p1", content: "Try the cleanup return", zoomName: "00_Kan(Kan/กัน)" });
  });

  it("can reply to a post that has no replies yet", async () => {
    renderAdmin(<AdminBoardPage />, "/admin/board");
    const p2 = (await screen.findByText("Meme of the day")).closest("article")!;
    fireEvent.click(await within(p2).findByRole("button", { name: "Write a reply" }));
    expect(within(p2).getByLabelText("Reply to this post")).toBeInTheDocument();
  });

  it("a viewer gets no reply box", async () => {
    me("viewer");
    renderAdmin(<AdminBoardPage />, "/admin/board");
    const p1 = (await screen.findByText("Anyone stuck on useEffect?")).closest("article")!;
    fireEvent.click(within(p1).getByRole("button", { name: "2 replies" }));
    await waitFor(() => expect(within(p1).queryByLabelText("Reply to this post")).toBeNull());
    expect(within(p1).getByText("Me! The cleanup part")).toBeInTheDocument();
  });

  it("says so when the board is empty", async () => {
    vi.mocked(boardService.getCohortPosts).mockResolvedValue([]);
    renderAdmin(<AdminBoardPage />, "/admin/board");
    expect(await screen.findByText("No posts in JSD13 yet.")).toBeInTheDocument();
  });
});
