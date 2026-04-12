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
  removeComment: (commentId: string, postId: string) => void;
  
  // Utilidades
  getCommentsByPost: (postId: string) => Comment[];
  getTotalByPost: (postId: string) => number;
  clearComments: (postId: string) => void;
  clearAllComments: () => void;
}

type CommentStore = CommentState & CommentActions;

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
      
      // Agregar comentario al store
      set((state) => {
        const currentComments = state.commentsByPost[postId] || [];
        return {
          commentsByPost: {
            ...state.commentsByPost,
            [postId]: [newComment, ...currentComments], // Agregar al inicio
          },
          totalByPost: {
            ...state.totalByPost,
            [postId]: (state.totalByPost[postId] || 0) + 1,
          },
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
              updatedComment,
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
    const { postId, commentId } = data;
    
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
      
      // Eliminar del store
      set((state) => {
        const currentComments = state.commentsByPost[postId] || [];
        return {
          commentsByPost: {
            ...state.commentsByPost,
            [postId]: currentComments.filter((c) => c.id !== commentId),
          },
          totalByPost: {
            ...state.totalByPost,
            [postId]: Math.max(0, (state.totalByPost[postId] || 0) - 1),
          },
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
    set((state) => {
      const { postId } = comment;
      const currentComments = state.commentsByPost[postId] || [];
      
      // Evitar duplicados
      const exists = currentComments.some((c) => c.id === comment.id);
      if (exists) return state;
      
      return {
        commentsByPost: {
          ...state.commentsByPost,
          [postId]: [comment, ...currentComments],
        },
        totalByPost: {
          ...state.totalByPost,
          [postId]: (state.totalByPost[postId] || 0) + 1,
        },
      };
    });
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
            comment,
            ...currentComments.slice(index + 1),
          ],
        },
      };
    });
  },

  removeComment: (commentId: string, postId: string) => {
    set((state) => {
      const currentComments = state.commentsByPost[postId] || [];
      return {
        commentsByPost: {
          ...state.commentsByPost,
          [postId]: currentComments.filter((c) => c.id !== commentId),
        },
        totalByPost: {
          ...state.totalByPost,
          [postId]: Math.max(0, (state.totalByPost[postId] || 0) - 1),
        },
      };
    });
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
