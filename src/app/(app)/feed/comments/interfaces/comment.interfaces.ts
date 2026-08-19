/**
 * Interfaces para el módulo de comentarios
 */

/**
 * Usuario que realizó el comentario
 */
export interface CommentAuthor {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

/**
 * Comentario principal
 */
export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: CommentAuthor;
  createdAt: string;
  updatedAt: string;
  
  // Respuestas anidadas (opcional, para futuro)
  parentId?: string | null;
  replies?: Comment[];
  repliesCount?: number;
  
  // Métricas
  likesCount?: number;
  isLiked?: boolean;
  
  // Control de edición
  isEdited?: boolean;
  editedAt?: string;
}

/**
 * DTO para crear un comentario
 */
export interface CreateCommentDTO {
  postId: string;
  content: string;
  parentId?: string | null; // Para respuestas
}

/**
 * DTO para actualizar un comentario
 */
export interface UpdateCommentDTO {
  commentId: string;
  postId: string; // Necesario para el endpoint del backend
  content: string;
}

/**
 * DTO para eliminar un comentario
 */
export interface DeleteCommentDTO {
  commentId: string;
  postId: string;
  parentId?: string | null; // Para respuestas: el store las quita del padre
}

/**
 * Respuesta del backend al listar comentarios
 */
export interface GetCommentsResponse {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Filtros para obtener comentarios
 */
export interface GetCommentsFilters {
  postId: string;
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'oldest' | 'popular';
  parentId?: string | null; // Para obtener solo respuestas de un comentario
}

/**
 * Estado de carga de comentarios
 */
export interface CommentLoadingState {
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

/**
 * Payload de eventos WebSocket
 */
export interface CommentSocketPayload {
  comment: Comment;
  postId: string;
  userId: string;
}

export interface CommentUpdatedPayload extends CommentSocketPayload {
  oldContent: string;
}

export interface CommentDeletedPayload {
  commentId: string;
  postId: string;
  userId: string;
}
