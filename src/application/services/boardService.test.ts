import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../infrastructure/api", () => ({
  api: {
    post: vi.fn().mockResolvedValue({ data: { data: null } }),
    delete: vi.fn().mockResolvedValue({ data: { data: null } }),
  },
}));

import { api } from "../../infrastructure/api";
import { boardService } from "./boardService";

describe("boardService reply reactions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adds a reply reaction on the post's reply route", async () => {
    await boardService.addCommentReaction({ postId: "p1", commentId: "c1", reaction: "like" });
    expect(api.post).toHaveBeenCalledWith("/board/posts/p1/comments/c1/reactions", { reaction: "like" });
  });

  it("removes a reply reaction on the same route", async () => {
    await boardService.removeCommentReaction({ postId: "p1", commentId: "c1" });
    expect(api.delete).toHaveBeenCalledWith("/board/posts/p1/comments/c1/reactions");
  });
});
