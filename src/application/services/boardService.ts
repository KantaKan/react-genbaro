import { api } from "../../infrastructure/api";
import type { BoardPost } from "@/lib/board";

interface CreateBoardEntryPayload {
  content: string;
  zoomName: string;
  cohort: number;
}

export const boardService = {
  async getPosts(): Promise<BoardPost[]> {
    const response = await api.get("/board/posts");
    return response.data.data;
  },

  async getPost(postId: string): Promise<BoardPost> {
    const response = await api.get(`/board/posts/${postId}`);
    return response.data.data;
  },

  async createPost(payload: CreateBoardEntryPayload) {
    const response = await api.post("/board/posts", payload);
    return response.data.data;
  },

  async createComment({ postId, ...payload }: CreateBoardEntryPayload & { postId: string }) {
    const response = await api.post(`/board/posts/${postId}/comments`, payload);
    return response.data.data;
  },

  async addReaction({ postId, reaction }: { postId: string; reaction: string }) {
    const response = await api.post(`/board/posts/${postId}/reactions`, { reaction });
    return response.data.data;
  },

  async removeReaction(postId: string) {
    const response = await api.delete(`/board/posts/${postId}/reactions`);
    return response.data.data;
  },

  async addCommentReaction({ commentId, reaction }: { commentId: string; reaction: string }) {
    const response = await api.post(`/board/comments/${commentId}/reactions`, { reaction });
    return response.data.data;
  },

  async removeCommentReaction(commentId: string) {
    const response = await api.delete(`/board/comments/${commentId}/reactions`);
    return response.data.data;
  },

  async deletePost(postId: string) {
    await api.delete(`/board/posts/${postId}`);
  },

  async deleteComment(commentId: string) {
    await api.delete(`/board/comments/${commentId}`);
  },
};

export const getPosts = boardService.getPosts;
export const getPost = boardService.getPost;
export const createPost = boardService.createPost;
export const createComment = boardService.createComment;
export const addReaction = boardService.addReaction;
export const removeReaction = boardService.removeReaction;
export const addCommentReaction = boardService.addCommentReaction;
export const removeCommentReaction = boardService.removeCommentReaction;
export const deletePost = boardService.deletePost;
export const deleteComment = boardService.deleteComment;

export default boardService;
