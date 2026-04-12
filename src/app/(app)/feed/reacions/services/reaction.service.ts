import { getAxiosInstance } from '@/lib/axios/axiosInstance';
import type {
  Reaction,
  CreateReactionDTO,
  UpdateReactionDTO,
  ReactionCounts,
  ReactionsResponse,
  GetReactionsFilters,
  ReactionType,
} from '../interfaces/reaction.interfaces';

const REACTION_ENDPOINTS = {
  CREATE: '/api/reactions',
  UPDATE: (postId: string) => `/api/reactions/${postId}`,
  DELETE: (postId: string) => `/api/reactions/${postId}`,
  BY_POST: (postId: string) => `/api/reactions/post/${postId}`,
  MY_REACTION: (postId: string) => `/api/reactions/post/${postId}/my-reaction`,
  COUNTS: (postId: string) => `/api/reactions/post/${postId}/counts`,
} as const;

export class ReactionService {
  private readonly axios = getAxiosInstance();

  /**
   * Crear o actualizar reacción
   * El backend maneja automáticamente si crear o actualizar
   */
  async react(data: CreateReactionDTO): Promise<Reaction> {
    try {
      console.log('[REACTION SERVICE] react - Datos:', data);
      
      // El backend espera type en minúsculas
      const response = await this.axios.post(REACTION_ENDPOINTS.CREATE, {
        postId: data.postId,
        type: data.type.toLowerCase(),
      });

      console.log('[REACTION SERVICE] react - Response:', response.data);
      return this.transformReaction(response.data.data || response.data);
    } catch (error) {
      console.error('[REACTION SERVICE] react - Error:', error);
      throw this.handleError(error, 'Error al reaccionar');
    }
  }

  /**
   * Actualizar reacción existente
   */
  async updateReaction(postId: string, data: UpdateReactionDTO): Promise<Reaction> {
    try {
      console.log('[REACTION SERVICE] updateReaction:', postId, data);
      
      const response = await this.axios.patch(REACTION_ENDPOINTS.UPDATE(postId), {
        type: data.type.toLowerCase(),
      });

      return this.transformReaction(response.data.data || response.data);
    } catch (error) {
      console.error('[REACTION SERVICE] updateReaction - Error:', error);
      throw this.handleError(error, 'Error al actualizar reacción');
    }
  }

  /**
   * Eliminar reacción
   */
  async unreact(postId: string): Promise<void> {
    try {
      console.log('[REACTION SERVICE] unreact:', postId);
      await this.axios.delete(REACTION_ENDPOINTS.DELETE(postId));
    } catch (error) {
      console.error('[REACTION SERVICE] unreact - Error:', error);
      throw this.handleError(error, 'Error al quitar reacción');
    }
  }

  /**
   * Obtener todas las reacciones de un post
   */
  async getByPost(postId: string, filters?: GetReactionsFilters): Promise<ReactionsResponse> {
    try {
      console.log('[REACTION SERVICE] getByPost:', postId);
      
      const params = this.buildQueryParams(filters);
      const response = await this.axios.get(REACTION_ENDPOINTS.BY_POST(postId), { params });

      return {
        reactions: Array.isArray(response.data.reactions)
          ? response.data.reactions.map(this.transformReaction)
          : [],
        counts: response.data.counts || this.getEmptyCounts(),
        currentUserReaction: response.data.currentUserReaction
          ? this.transformReaction(response.data.currentUserReaction)
          : null,
        total: response.data.total || 0,
      };
    } catch (error) {
      console.error('[REACTION SERVICE] getByPost - Error:', error);
      throw this.handleError(error, 'Error al obtener reacciones');
    }
  }

  /**
   * Obtener mi reacción en un post
   */
  async getMyReaction(postId: string): Promise<Reaction | null> {
    try {
      console.log('[REACTION SERVICE] getMyReaction:', postId);
      
      const response = await this.axios.get(REACTION_ENDPOINTS.MY_REACTION(postId));
      
      if (!response.data || !response.data.data) {
        return null;
      }

      return this.transformReaction(response.data.data);
    } catch (error) {
      // 404 significa que no hay reacción, no es un error
      if ((error as any)?.response?.status === 404) {
        return null;
      }
      
      console.error('[REACTION SERVICE] getMyReaction - Error:', error);
      throw this.handleError(error, 'Error al obtener tu reacción');
    }
  }

  /**
   * Obtener contadores de reacciones de un post
   */
  async getCounts(postId: string): Promise<ReactionCounts> {
    try {
      console.log('[REACTION SERVICE] getCounts:', postId);
      
      const response = await this.axios.get(REACTION_ENDPOINTS.COUNTS(postId));
      
      return response.data.counts || this.getEmptyCounts();
    } catch (error) {
      console.error('[REACTION SERVICE] getCounts - Error:', error);
      throw this.handleError(error, 'Error al obtener contadores');
    }
  }

  // ============================================
  // Métodos privados auxiliares
  // ============================================

  /**
   * Transforma reacción del backend al formato del cliente
   */
  private transformReaction(data: any): Reaction {
    return {
      id: data._id || data.id,
      postId: data.postId,
      userId: data.userId,
      type: data.type?.toUpperCase() as ReactionType,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      user: data.user ? {
        id: data.user._id || data.user.id,
        username: data.user.username,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        avatar: data.user.avatar,
      } : undefined,
    };
  }

  /**
   * Construye parámetros de query
   */
  private buildQueryParams(filters?: GetReactionsFilters): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};

    if (filters.postId) params.postId = filters.postId;
    if (filters.userId) params.userId = filters.userId;
    if (filters.type) params.type = filters.type.toLowerCase();
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    return params;
  }

  /**
   * Retorna contadores vacíos
   */
  private getEmptyCounts(): ReactionCounts {
    return {
      LIKE: 0,
      LOVE: 0,
      HAHA: 0,
      WOW: 0,
      SAD: 0,
      ANGRY: 0,
    };
  }

  /**
   * Maneja errores de HTTP
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error instanceof Error && !error.message.includes('AxiosError')) {
      return error;
    }

    const backendMessage = error?.response?.data?.message;
    if (backendMessage) {
      return new Error(backendMessage);
    }

    return new Error(defaultMessage);
  }
}

/**
 * Instancia singleton del servicio
 */
export const reactionService = new ReactionService();
