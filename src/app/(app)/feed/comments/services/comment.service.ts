import { getAxiosInstance } from '@/lib/axios/axiosInstance'
import type {
  Comment,
  CreateCommentDTO,
  DeleteCommentDTO,
  GetCommentsFilters,
  GetCommentsResponse,
  UpdateCommentDTO,
} from '../interfaces/comment.interfaces'

/**
 * Endpoints del API de comentarios
 */
const COMMENT_ENDPOINTS = {
  BY_POST: (postId: string) => `/api/posts/${postId}/comments`,
  COMMENT_BY_ID: (postId: string, commentId: string) => `/api/posts/${postId}/comments/${commentId}`,
  REPLIES: (postId: string, commentId: string) => `/api/posts/${postId}/comments/${commentId}/replies`,
  UPDATE: (postId: string, commentId: string) => `/api/posts/${postId}/comments/${commentId}`,
  DELETE: (postId: string, commentId: string) => `/api/posts/${postId}/comments/${commentId}`,
} as const

/**
 * Servicio para gestión de comentarios
 * CRUD completo + integración con WebSocket
 */
export class CommentService {
  private readonly axios = getAxiosInstance()

  /**
   * Transforma la respuesta del backend al formato esperado por el cliente
   */
  private transformBackendComment(backendComment: any): Comment {
    return {
      id: backendComment._id || backendComment.id,
      postId: backendComment.postId,
      content: backendComment.content,
      author: {
        id: backendComment.user?.id || backendComment.author?.id,
        username: backendComment.user?.username || backendComment.author?.username,
        firstName: backendComment.user?.firstName || backendComment.author?.firstName,
        lastName: backendComment.user?.lastName || backendComment.author?.lastName,
        avatar: backendComment.user?.avatar || backendComment.author?.avatar || null,
      },
      createdAt: backendComment.createdAt,
      updatedAt: backendComment.updatedAt,
      parentId: backendComment.parentCommentId || backendComment.parentId || null,
      isEdited: backendComment.isEdited || false,
      editedAt: backendComment.editedAt,
      likesCount: backendComment.likesCount,
      repliesCount: backendComment.repliesCount,
    }
  }

  /**
   * Crea un nuevo comentario
   *
   * @param data - Datos del comentario
   * @returns Comentario creado
   *
   * @example
   * const comment = await commentService.create({
   *   postId: '123',
   *   content: 'Gran publicación!',
   *   parentId: null
   * });
   */
  async create(data: CreateCommentDTO): Promise<Comment> {
    try {
      // Construir el body según sea comentario normal o reply
      const requestBody: { content: string; parentCommentId?: string } = {
        content: data.content,
      }

      // Solo agregar parentCommentId si es un reply
      if (data.parentId) {
        requestBody.parentCommentId = data.parentId
      }

      const response = await this.axios.post(COMMENT_ENDPOINTS.BY_POST(data.postId), requestBody)

      // Extraer el comentario del wrapper { message, data }
      const commentData = response.data.data || response.data
      return this.transformBackendComment(commentData)
    } catch (error) {
      throw this.handleError(error, 'Error al crear comentario')
    }
  }

  /**
   * Actualiza un comentario existente
   *
   * @param data - Datos de actualización
   * @returns Comentario actualizado
   */
  async update(data: UpdateCommentDTO): Promise<Comment> {
    try {
      console.log(' Actualizando comentario:', {
        postId: data.postId,
        commentId: data.commentId,
        content: data.content,
        endpoint: COMMENT_ENDPOINTS.UPDATE(data.postId, data.commentId),
      })

      const response = await this.axios.patch(COMMENT_ENDPOINTS.UPDATE(data.postId, data.commentId), {
        content: data.content,
      })

      console.log(' Comentario actualizado:', response.data)

      const commentData = response.data.data || response.data
      return this.transformBackendComment(commentData)
    } catch (error) {
      console.error(' Error al actualizar comentario:', error)
      throw this.handleError(error, 'Error al actualizar comentario')
    }
  }

  /**
   * Elimina un comentario
   *
   * @param data - ID del comentario y post
   */
  async delete(data: DeleteCommentDTO): Promise<void> {
    try {
      await this.axios.delete(COMMENT_ENDPOINTS.DELETE(data.postId, data.commentId))
      console.log(' Comentario eliminado:', data.commentId)
    } catch (error) {
      throw this.handleError(error, 'Error al eliminar comentario')
    }
  }

  /**
   * Obtiene comentarios de un post
   *
   * @param filters - Filtros de búsqueda
   * @returns Lista paginada de comentarios
   *
   * @example
   * const response = await commentService.getByPost({
   *   postId: '123',
   *   page: 1,
   *   limit: 20,
   *   sortBy: 'newest'
   * });
   */
  async getByPost(filters: GetCommentsFilters): Promise<GetCommentsResponse> {
    try {
      const params = this.buildQueryParams(filters)
      const endpoint = COMMENT_ENDPOINTS.BY_POST(filters.postId)

      console.log(` Llamando a:`, {
        endpoint,
        postId: filters.postId,
        params,
        baseURL: this.axios.defaults.baseURL,
      })

      const response = await this.axios.get(endpoint, { params })

      // Transformar respuesta del backend
      const responseData = response.data.data || response.data
      const comments = Array.isArray(responseData) ? responseData : responseData.comments || []

      const transformedComments = comments.map((comment: any) => this.transformBackendComment(comment))

      return {
        comments: transformedComments,
        total: responseData.total || transformedComments.length,
        page: filters.page || 1,
        limit: filters.limit || 50,
        hasMore: responseData.hasMore || false,
      }
    } catch (error) {
      console.error(' Error al obtener comentarios:', error)
      throw this.handleError(error, 'Error al obtener comentarios')
    }
  }

  /**
   * Obtiene un comentario por ID
   *
   * @param commentId - ID del comentario
   * @param postId - ID del post
   * @returns Comentario encontrado
   */
  async getById(commentId: string, postId: string): Promise<Comment> {
    try {
      const response = await this.axios.get(COMMENT_ENDPOINTS.COMMENT_BY_ID(postId, commentId))

      const commentData = response.data.data || response.data
      return this.transformBackendComment(commentData)
    } catch (error) {
      throw this.handleError(error, 'Error al obtener comentario')
    }
  }

  /**
   * Obtiene las respuestas de un comentario específico
   *
   * @param postId - ID del post
   * @param commentId - ID del comentario padre
   * @returns Lista de respuestas
   *
   * @example
   * const replies = await commentService.getReplies('postId', 'commentId');
   */
  async getReplies(postId: string, commentId: string): Promise<Comment[]> {
    try {
      console.log(` Obteniendo respuestas de comentario:`, {
        postId,
        commentId,
        endpoint: COMMENT_ENDPOINTS.REPLIES(postId, commentId),
      })

      const response = await this.axios.get(COMMENT_ENDPOINTS.REPLIES(postId, commentId))

      console.log(` Respuestas obtenidas:`, response.data)

      // Transformar respuesta del backend
      const responseData = response.data.data || response.data
      const replies = Array.isArray(responseData) ? responseData : responseData.replies || []

      const transformedReplies = replies.map((reply: any) => this.transformBackendComment(reply))

      console.log(` ${transformedReplies.length} respuestas transformadas`)

      return transformedReplies
    } catch (error) {
      console.error(' Error al obtener respuestas:', error)
      throw this.handleError(error, 'Error al obtener respuestas del comentario')
    }
  }

  // ============================================
  // Métodos privados auxiliares
  // ============================================

  /**
   * Construye parámetros de query desde filtros
   */
  private buildQueryParams(filters: GetCommentsFilters): Record<string, any> {
    const params: Record<string, any> = {}

    if (filters.page) params.page = filters.page
    if (filters.limit) params.limit = filters.limit
    if (filters.sortBy) params.sortBy = filters.sortBy
    if (filters.parentId !== undefined) params.parentId = filters.parentId

    return params
  }

  /**
   * Maneja errores de HTTP
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error instanceof Error && !error.message.includes('AxiosError')) {
      return error
    }

    const backendMessage = error?.response?.data?.message
    if (backendMessage) {
      return new Error(backendMessage)
    }

    return new Error(defaultMessage)
  }
}

/**
 * Instancia singleton del servicio
 */
export const commentService = new CommentService()
