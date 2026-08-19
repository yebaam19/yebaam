import { create } from 'zustand';
import type {
  Comment,
  CreateCommentDTO,
  UpdateCommentDTO,
  DeleteCommentDTO,
  GetCommentsFilters,
  CommentLoadingState,
} from '../interfaces/comment.interfaces';
import { commentService } from '../services/comment.service';

/**
 * Estado del store de comentarios
 */
interface CommentState {
  // Comentarios agrupados por postId
  commentsByPost: Record<string, Comment[]>;
  
  // Total de comentarios por post
  totalByPost: Record<string, number>;
  
  // Estados de carga
  loadingStates: Record<string, CommentLoadingState>;
  
  // Errores
  errors: Record<string, string | null>;
}

/**
 * Acciones del store de comentarios
 */
interface CommentActions {
  // Obtener comentarios
  fetchCommentsByPost: (filters: GetCommentsFilters) => Promise<void>;
  
  // CRUD
  createComment: (data: CreateCommentDTO) => Promise<Comment>;
  updateComment: (data: UpdateCommentDTO) => Promise<Comment>;
  deleteComment: (data: DeleteCommentDTO) => Promise<void>;
  
  // Acciones directas (para WebSocket)
  addComment: (comment: Comment) => void;
  updateCommentInList: (comment: Comment) => void;
  removeComment: (commentId: string, postId: string, parentId?: string | null) => void;
  
  // Utilidades
  getCommentsByPost: (postId: string) => Comment[];
  getTotalByPost: (postId: string) => number;
  clearComments: (postId: string) => void;
  clearAllComments: () => void;
}

type CommentStore = CommentState & CommentActions;

/**
 * Mezcla un comentario recién creado/recibido en el estado. Un mismo comentario
 * llega por dos caminos (`createComment` para el autor + el INSERT de realtime
 * para todos, incluido el autor), así que ambos pasan por aquí para que la
 * dedupe por id y el conteo sean idénticos.
 *
 * - Raíz: se antepone a `commentsByPost[postId]` y suma 1 a `totalByPost`.
 * - Respuesta (`parentId`): NUNCA entra a la lista raíz ni al total; se cuelga
 *   del padre en `parent.replies` y sube `parent.repliesCount`.
 *
 * Devuelve `null` si no hay nada que cambiar (duplicado o padre no cargado).
 */
function mergeIncomingComment(
  state: CommentState,
  comment: Comment,
): Pick<CommentState, 'commentsByPost' | 'totalByPost'> | null {
  const { postId, parentId } = comment;
  const currentComments = state.commentsByPost[postId] || [];

  if (parentId) {
    const parentIndex = currentComments.findIndex((c) => c.id === parentId);
    if (parentIndex === -1) return null;
    const parent = currentComments[parentIndex];
    const knownReplies = parent.replies ?? [];
    if (knownReplies.some((r) => r.id === comment.id)) return null;

    const nextParent: Comment = {
      ...parent,
      replies: [...knownReplies, comment],
      repliesCount: (parent.repliesCount ?? 0) + 1,
    };
    return {
      commentsByPost: {
        ...state.commentsByPost,
        [postId]: [
          ...currentComments.slice(0, parentIndex),
          nextParent,
          ...currentComments.slice(parentIndex + 1),
        ],
      },
      totalByPost: state.totalByPost,
    };
  }

  if (currentComments.some((c) => c.id === comment.id)) return null;

  return {
    commentsByPost: {
      ...state.commentsByPost,
      [postId]: [comment, ...currentComments], // Agregar al inicio
    },
    totalByPost: {
      ...state.totalByPost,
      [postId]: (state.totalByPost[postId] || 0) + 1,
    },
  };
}

/**
 * Al reemplazar un comentario por su versión del servidor (edición propia o
 * UPDATE de realtime) conservamos la contabilidad de respuestas que el store
 * lleva en memoria: la fila de la DB no trae `replies` y su `replies_count`
 * puede ir por detrás; sin esto se perdería la dedupe y el contador bajaría.
 */
function withPreservedReplies(prev: Comment, next: Comment): Comment {
  return {
    ...next,
    replies: prev.replies,
    repliesCount: Math.max(prev.repliesCount ?? 0, next.repliesCount ?? 0),
  };
}

/**
 * Quita un comentario del estado (borrado propio o DELETE de realtime).
 *
 * - Raíz: se filtra de `commentsByPost[postId]` y baja 1 en `totalByPost`.
 * - Respuesta: se busca al padre (por `parentId` si viene, si no por el que la
 *   tenga en `replies`), se saca de `parent.replies` y baja `repliesCount`.
 *   Nunca toca `totalByPost`.
 *
 * Devuelve `null` si no había nada que quitar.
 */
function removeCommentFromState(
  state: CommentState,
  commentId: string,
  postId: string,
  parentId?: string | null,
): Pick<CommentState, 'commentsByPost' | 'totalByPost'> | null {
  const currentComments = state.commentsByPost[postId] || [];

  const remaining = currentComments.filter((c) => c.id !== commentId);
  if (remaining.length !== currentComments.length) {
    return {
      commentsByPost: { ...state.commentsByPost, [postId]: remaining },
      totalByPost: {
        ...state.totalByPost,
        [postId]: Math.max(0, (state.totalByPost[postId] || 0) - 1),
      },
    };
  }

  const parentIndex = currentComments.findIndex((c) =>
    parentId ? c.id === parentId : (c.replies ?? []).some((r) => r.id === commentId),
  );
  if (parentIndex === -1) return null;
  const parent = currentComments[parentIndex];
  const nextParent: Comment = {
    ...parent,
    replies: (parent.replies ?? []).filter((r) => r.id !== commentId),
    repliesCount: Math.max(0, (parent.repliesCount ?? 0) - 1),
  };
  return {
    commentsByPost: {
      ...state.commentsByPost,
      [postId]: [
        ...currentComments.slice(0, parentIndex),
        nextParent,
        ...currentComments.slice(parentIndex + 1),
      ],
    },
    totalByPost: state.totalByPost,
  };
}

/**
 * Store de Zustand para comentarios
 * Sin devtools por rendimiento
 */
export const useCommentStore = create<CommentStore>((set, get) => ({
  // ============================================
  // Estado inicial
  // ============================================
  commentsByPost: {},
  totalByPost: {},
  loadingStates: {},
  errors: {},

  // ============================================
  // Obtener comentarios del backend
  // ============================================
  fetchCommentsByPost: async (filters: GetCommentsFilters) => {
    const { postId } = filters;
    
    // Actualizar estado de carga
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [postId]: {
          ...state.loadingStates[postId],
          isLoading: true,
        },
      },
      errors: {
        ...state.errors,
        [postId]: null,
      },
    }));

    try {
      const response = await commentService.getByPost(filters);
      
   ;
      
      set((state) => ({
        commentsByPost: {
          ...state.commentsByPost,
          [postId]: response.comments,
        },
        totalByPost: {
          ...state.totalByPost,
          [postId]: response.total,
        },
        loadingStates: {
          ...state.loadingStates,
          [postId]: {
            ...state.loadingStates[postId],
            isLoading: false,
          },
        },
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      set((state) => ({
        loadingStates: {
          ...state.loadingStates,
          [postId]: {
            ...state.loadingStates[postId],
            isLoading: false,
          },
        },
        errors: {
          ...state.errors,
          [postId]: errorMessage,
        },
      }));
      
      throw error;
    }
  },

  // ============================================
  // Crear comentario
  // ============================================
  createComment: async (data: CreateCommentDTO) => {
    const { postId } = data;
    
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [postId]: {
          ...state.loadingStates[postId],
          isCreating: true,
        },
      },
    }));

    try {
      const newComment = await commentService.create(data);

      // Agregar comentario al store (dedupe: el INSERT de realtime puede
      // haber llegado antes que esta respuesta)
      set((state) => {
        const merged = mergeIncomingComment(state, newComment);
        return {
          ...(merged ?? {}),
          loadingStates: {
            ...state.loadingStates,
            [postId]: {
              ...state.loadingStates[postId],
              isCreating: false,
            },
          },
        };
      });

      return newComment;
    } catch (error) {
      set((state) => ({
        loadingStates: {
          ...state.loadingStates,
          [postId]: {
            ...state.loadingStates[postId],
            isCreating: false,
          },
        },
      }));
      
      throw error;
    }
  },

  // ============================================
  // Actualizar comentario
  // ============================================
  updateComment: async (data: UpdateCommentDTO) => {
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        updating: {
          ...state.loadingStates.updating,
          isUpdating: true,
        },
      },
    }));

    try {
      const updatedComment = await commentService.update(data);
      
      // Actualizar en el store
      set((state) => {
        const newCommentsByPost = { ...state.commentsByPost };
        
        // Buscar en qué post está el comentario
        for (const postId in newCommentsByPost) {
          const comments = newCommentsByPost[postId];
          const index = comments.findIndex((c) => c.id === data.commentId);
          
          if (index !== -1) {
            newCommentsByPost[postId] = [
              ...comments.slice(0, index),
              withPreservedReplies(comments[index], updatedComment),
              ...comments.slice(index + 1),
            ];
            break;
          }
        }
        
        return {
          commentsByPost: newCommentsByPost,
          loadingStates: {
            ...state.loadingStates,
            updating: {
              ...state.loadingStates.updating,
              isUpdating: false,
            },
          },
        };
      });

      return updatedComment;
    } catch (error) {
      set((state) => ({
        loadingStates: {
          ...state.loadingStates,
          updating: {
            ...state.loadingStates.updating,
            isUpdating: false,
          },
        },
      }));
      
      throw error;
    }
  },

  // ============================================
  // Eliminar comentario
  // ============================================
  deleteComment: async (data: DeleteCommentDTO) => {
    const { postId, commentId, parentId } = data;
    
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [postId]: {
          ...state.loadingStates[postId],
          isDeleting: true,
        },
      },
    }));

    try {
      await commentService.delete(data);
      
      // Eliminar del store (raíz o respuesta colgada de su padre)
      set((state) => {
        const removed = removeCommentFromState(state, commentId, postId, parentId);
        return {
          ...(removed ?? {}),
          loadingStates: {
            ...state.loadingStates,
            [postId]: {
              ...state.loadingStates[postId],
              isDeleting: false,
            },
          },
        };
      });
    } catch (error) {
      set((state) => ({
        loadingStates: {
          ...state.loadingStates,
          [postId]: {
            ...state.loadingStates[postId],
            isDeleting: false,
          },
        },
      }));
      
      throw error;
    }
  },

  // ============================================
  // Acciones directas (WebSocket)
  // ============================================
  addComment: (comment: Comment) => {
    set((state) => mergeIncomingComment(state, comment) ?? state);
  },

  updateCommentInList: (comment: Comment) => {
    set((state) => {
      const { postId } = comment;
      const currentComments = state.commentsByPost[postId] || [];
      const index = currentComments.findIndex((c) => c.id === comment.id);
      
      if (index === -1) return state;

      return {
        commentsByPost: {
          ...state.commentsByPost,
          [postId]: [
            ...currentComments.slice(0, index),
            withPreservedReplies(currentComments[index], comment),
            ...currentComments.slice(index + 1),
          ],
        },
      };
    });
  },

  removeComment: (commentId: string, postId: string, parentId?: string | null) => {
    set((state) => removeCommentFromState(state, commentId, postId, parentId) ?? state);
  },

  // ============================================
  // Utilidades
  // ============================================
  getCommentsByPost: (postId: string) => {
    return get().commentsByPost[postId] || [];
  },

  getTotalByPost: (postId: string) => {
    return get().totalByPost[postId] || 0;
  },

  clearComments: (postId: string) => {
    set((state) => {
      const newCommentsByPost = { ...state.commentsByPost };
      const newTotalByPost = { ...state.totalByPost };
      
      delete newCommentsByPost[postId];
      delete newTotalByPost[postId];
      
      return {
        commentsByPost: newCommentsByPost,
        totalByPost: newTotalByPost,
      };
    });
  },

  clearAllComments: () => {
    set({
      commentsByPost: {},
      totalByPost: {},
      loadingStates: {},
      errors: {},
    });
  },
}));
