import { getAxiosInstance } from '@/lib/http/legacy-client';

const axios = getAxiosInstance();

export interface LiveStreamComment {
  id: string;
  entityType: 'liveStream';
  entityId: string;
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName?: string;
    avatar?: string;
  };
  content: string;
  mentions: string[];
  likesCount: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
}

export const liveStreamCommentService = {
  /**
   * Crear comentario en un stream
   * POST /live-streams/:streamId/comments
   */
  async createComment(streamId: string, data: CreateCommentRequest): Promise<LiveStreamComment> {
    const response = await axios.post(`/live-streams/${streamId}/comments`, data);
    return response.data;
  },

  /**
   * Obtener comentarios de un stream
   * GET /live-streams/:streamId/comments
   */
  async getComments(
    streamId: string,
    options?: { limit?: number; cursor?: string }
  ): Promise<LiveStreamComment[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.cursor) params.append('cursor', options.cursor);
    
    const response = await axios.get(
      `/live-streams/${streamId}/comments${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response.data;
  },

  /**
   * Eliminar comentario de un stream
   * DELETE /live-streams/:streamId/comments/:commentId
   */
  async deleteComment(streamId: string, commentId: string): Promise<void> {
    await axios.delete(`/live-streams/${streamId}/comments/${commentId}`);
  },
};
