import { getAxiosInstance } from '@/lib/axios/axiosInstance';

/**
 * Tipos de reacción disponibles
 */
export type ReactionType = 'like' | 'love' | 'wow' | 'haha' | 'sad' | 'angry';

/**
 * Tipo de entidad para reacciones y comentarios
 */
export type EntityType = 'photo' | 'video';

/**
 * Interface para una reacción
 */
export interface Reaction {
  id: string;
  type: ReactionType;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  createdAt: string;
}

/**
 * Interface para un comentario
 */
export interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  content: string;
  parentCommentId?: string;
  likesCount: number;
  repliesCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface para la respuesta de reacciones
 */
export interface ReactionsResponse {
  reactions: Reaction[];
  counts: Record<ReactionType, number>;
  total: number;
}

/**
 * Interface para la respuesta de comentarios
 */
export interface CommentsResponse {
  comments: Comment[];
  nextCursor?: string;
  total: number;
}

/**
 * Servicio para manejar interacciones (reacciones y comentarios) en fotos y videos del perfil
 */
class ProfileMediaInteractionsService {
  private get api() {
    return getAxiosInstance();
  }

  private getBasePath(entityType: EntityType): string {
    return entityType === 'photo' ? '/api/profile/photos' : '/api/profile/videos';
  }

  // ========================================
  // REACCIONES
  // ========================================

  /**
   * Reaccionar a una foto o video
   */
  async react(entityType: EntityType, entityId: string, type: ReactionType): Promise<Reaction> {
    const basePath = this.getBasePath(entityType);
    const response = await this.api.post(`${basePath}/${entityId}/reactions`, { type });
    return response.data;
  }

  /**
   * Quitar reacción de una foto o video
   */
  async unreact(entityType: EntityType, entityId: string): Promise<void> {
    const basePath = this.getBasePath(entityType);
    await this.api.delete(`${basePath}/${entityId}/reactions`);
  }

  /**
   * Obtener reacciones de una foto o video
   */
  async getReactions(
    entityType: EntityType,
    entityId: string,
    type?: ReactionType
  ): Promise<ReactionsResponse> {
    const basePath = this.getBasePath(entityType);
    const params = type ? { type } : {};
    const response = await this.api.get(`${basePath}/${entityId}/reactions`, { params });
    return response.data;
  }

  /**
   * Obtener mi reacción a una foto o video
   */
  async getMyReaction(entityType: EntityType, entityId: string): Promise<Reaction | null> {
    const basePath = this.getBasePath(entityType);
    const response = await this.api.get(`${basePath}/${entityId}/reactions/me`);
    return response.data.reaction;
  }

  // ========================================
  // COMENTARIOS
  // ========================================

  /**
   * Comentar en una foto o video
   */
  async comment(
    entityType: EntityType,
    entityId: string,
    content: string,
    parentCommentId?: string
  ): Promise<Comment> {
    const basePath = this.getBasePath(entityType);
    const response = await this.api.post(`${basePath}/${entityId}/comments`, {
      content,
      parentCommentId,
    });
    return response.data;
  }

  /**
   * Obtener comentarios de una foto o video
   */
  async getComments(
    entityType: EntityType,
    entityId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<CommentsResponse> {
    const basePath = this.getBasePath(entityType);
    const params: any = { limit };
    if (cursor) {
      params.cursor = cursor;
    }
    const response = await this.api.get(`${basePath}/${entityId}/comments`, { params });
    return response.data;
  }

  /**
   * Obtener respuestas de un comentario
   */
  async getCommentReplies(
    entityType: EntityType,
    entityId: string,
    commentId: string
  ): Promise<Comment[]> {
    const basePath = this.getBasePath(entityType);
    const response = await this.api.get(`${basePath}/${entityId}/comments/${commentId}/replies`);
    return response.data.replies;
  }

  /**
   * Eliminar un comentario
   */
  async deleteComment(
    entityType: EntityType,
    entityId: string,
    commentId: string
  ): Promise<void> {
    const basePath = this.getBasePath(entityType);
    await this.api.delete(`${basePath}/${entityId}/comments/${commentId}`);
  }
}

export const profileMediaInteractionsService = new ProfileMediaInteractionsService();
