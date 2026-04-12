import { getAxiosInstance } from '@/lib/axios/axiosInstance';
import { ReactionType } from '../../reacions';
import { Post } from '@/features/post';

/**
 * Interface para la respuesta del backend
 */
interface ApiResponse<T> {
  message: string;
  data: T;
}

/**
 * Interface para el payload de crear reacción
 */
interface CreateReactionDto {
  postId: string;
  reactionType: string; // Backend espera lowercase: 'like', 'love', etc.
}

/**
 * Interface para el payload de actualizar reacción
 */
interface UpdateReactionDto {
  reactionType: string;
}

/**
 * Servicio enfocado EXCLUSIVAMENTE en operaciones de reacciones
 * Sigue el patrón de separación de responsabilidades
 */
class ReactionService {
  private readonly baseUrl = '/reactions';
  
  /**
   * Obtener instancia de axios configurada
   */
  private get api() {
    return getAxiosInstance();
  }

  /**
   * Helper para extraer data de la respuesta del backend
   * Maneja ambos formatos: { message, data } o data directa
   */
  private unwrapResponse<T>(response: T | ApiResponse<T>): T {
    if (response && typeof response === 'object' && 'data' in response && 'message' in response) {
      return (response as ApiResponse<T>).data;
    }
    return response as T;
  }

  /**
   * Convierte ReactionType enum a string lowercase que espera el backend
   * LIKE → 'like', LOVE → 'love', etc.
   */
  private normalizeReactionType(reactionType: ReactionType): string {
    return reactionType.toLowerCase();
  }

  /**
   * Crear o actualizar reacción en un post
   * El backend maneja automáticamente si es create o update
   * 
   * @param postId - ID del post
   * @param reactionType - Tipo de reacción (LIKE, LOVE, etc.)
   * @returns Post actualizado desde el backend
   */
  async createReaction(postId: string, reactionType: ReactionType): Promise<Post> {
    try {
      console.log(' [ReactionService] Creando reacción:', { postId, reactionType });
      
      const payload: CreateReactionDto = {
        postId,
        reactionType: this.normalizeReactionType(reactionType),
      };

      const response = await this.api.post<ApiResponse<any>>(
        this.baseUrl,
        payload
      );

      // El backend devuelve la reacción creada, pero necesitamos el post actualizado
      // Hacer fetch del post actualizado
      return await this.getPostAfterReaction(postId);
    } catch (error) {
      console.error(' [ReactionService] Error creando reacción:', error);
      throw error;
    }
  }

  /**
   * Actualizar tipo de reacción existente
   * 
   * @param postId - ID del post
   * @param reactionType - Nuevo tipo de reacción
   * @returns Post actualizado desde el backend
   */
  async updateReaction(postId: string, reactionType: ReactionType): Promise<Post> {
    try {
      console.log(' [ReactionService] Actualizando reacción:', { postId, reactionType });
      
      const payload: UpdateReactionDto = {
        reactionType: this.normalizeReactionType(reactionType),
      };

      await this.api.patch(
        `${this.baseUrl}/${postId}`,
        payload
      );

      return await this.getPostAfterReaction(postId);
    } catch (error) {
      console.error(' [ReactionService] Error actualizando reacción:', error);
      throw error;
    }
  }

  /**
   * Eliminar reacción de un post
   * 
   * @param postId - ID del post
   * @returns Post actualizado sin la reacción
   */
  async deleteReaction(postId: string): Promise<Post> {
    try {
      console.log('🗑️ [ReactionService] Eliminando reacción:', postId);
      
      await this.api.delete(`${this.baseUrl}/${postId}`);
      
      return await this.getPostAfterReaction(postId);
    } catch (error) {
      console.error(' [ReactionService] Error eliminando reacción:', error);
      throw error;
    }
  }

  /**
   * Obtener el post actualizado después de una operación de reacción
   * Llama al endpoint de posts para obtener el estado fresco
   * 
   * @param postId - ID del post
   * @returns Post actualizado con contadores y reacción del usuario
   */
  private async getPostAfterReaction(postId: string): Promise<Post> {
    try {
      console.log(' [ReactionService] Obteniendo post actualizado:', postId);
      
      const response = await this.api.get<ApiResponse<any>>(`/posts/${postId}`);
      const postData = this.unwrapResponse(response.data);
      
      console.log(' [ReactionService] Post data del backend:', postData);
      
      // Transformar post del backend al formato del frontend
      const transformedPost = this.transformBackendPost(postData);
      
      console.log(' [ReactionService] Post transformado:', transformedPost);
      return transformedPost;
    } catch (error) {
      console.error(' [ReactionService] Error obteniendo post:', error);
      throw error;
    }
  }

  /**
   * Transforma un post del formato backend al formato frontend
   * Centraliza la lógica de transformación para mantener consistencia
   */
  private transformBackendPost(backendPost: any): Post {
    return {
      id: backendPost._id || backendPost.id,
      content: backendPost.content,
      backgroundColor: backendPost.backgroundColor,
      mediaFiles: (backendPost.mediaFiles || []).map((media: any) => ({
        id: media.id || media._id,
        url: media.url,
        type: media.type?.toUpperCase() as 'IMAGE' | 'VIDEO',
        thumbnailUrl: media.thumbnailUrl,
        s3Key: media.s3Key,
        size: media.size,
        duration: media.duration,
        mimeType: media.mimeType,
      })),
      privacy: typeof backendPost.privacy === 'string' 
        ? { value: backendPost.privacy } 
        : backendPost.privacy,
      author: {
        id: backendPost.authorId || backendPost.author?.id,
        username: backendPost.authorUsername || backendPost.author?.username,
        firstName: backendPost.authorFirstName || backendPost.author?.firstName,
        lastName: backendPost.authorLastName || backendPost.author?.lastName,
        avatar: backendPost.authorAvatar || backendPost.author?.avatar,
        _id: backendPost.authorId || backendPost.author?.id,
      },
      reactionsCount: backendPost.reactionsCount || {
        like: 0,
        love: 0,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0,
      },
      commentsCount: backendPost.commentsCount || 0,
      sharesCount: backendPost.sharesCount || 0,
      currentUserReaction: backendPost.myReaction?.toUpperCase() || undefined,
      createdAt: backendPost.createdAt,
      updatedAt: backendPost.updatedAt,
      feeling: backendPost.feeling,
      location: backendPost.location,
      taggedUsers: backendPost.taggedUsers,
      gif: backendPost.gif,
    };
  }

  /**
   * Obtener todas las reacciones de un post
   * Útil para mostrar quién reaccionó con qué
   * 
   * @param postId - ID del post
   * @returns Array de reacciones con información del usuario
   */
  async getReactionsByPost(postId: string): Promise<any[]> {
    try {
      console.log('[ReactionService] Obteniendo reacciones del post:', postId);
      
      const response = await this.api.get<ApiResponse<any[]>>(
        `${this.baseUrl}/post/${postId}`
      );
      
      return this.unwrapResponse(response.data);
    } catch (error) {
      console.error(' [ReactionService] Error obteniendo reacciones:', error);
      throw error;
    }
  }

  /**
   * Obtener contadores de reacciones de un post
   * 
   * @param postId - ID del post
   * @returns Objeto con contadores por tipo de reacción
   */
  async getReactionCounts(postId: string): Promise<Record<string, number>> {
    try {
      const response = await this.api.get<ApiResponse<Record<string, number>>>(
        `${this.baseUrl}/post/${postId}/counts`
      );
      
      return this.unwrapResponse(response.data);
    } catch (error) {
      console.error(' [ReactionService] Error obteniendo contadores:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export const reactionService = new ReactionService();
