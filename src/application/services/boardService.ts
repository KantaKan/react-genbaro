import { api } from "../../infrastructure/api";

export const boardService = {
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
};

export const addReaction = boardService.addReaction;
export const removeReaction = boardService.removeReaction;
export const addCommentReaction = boardService.addCommentReaction;
export const removeCommentReaction = boardService.removeCommentReaction;

export default boardService;
