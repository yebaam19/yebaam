import { create } from 'zustand';
import { toast } from 'sonner';
import type {
  Reaction,
  ReactionCounts,
  CreateReactionDTO,
  UpdateReactionDTO,
  ReactionsResponse,
  GetReactionsFilters,
  ReactionType,
} from '../interfaces/reaction.interfaces';
import { reactionService } from '../services/reaction.service';

interface ReactionState {
  // Estado principal
  reactions: Reaction[];
  reactionsByPost: Record<string, Reaction[]>; // postId -> reactions[]
  countsByPost: Record<string, ReactionCounts>; // postId -> counts
  myReactionsByPost: Record<string, Reaction | null>; // postId -> myReaction
  isLoading: boolean;
  error: string | null;

  // Acciones - API calls
  reactToPost: (postId: string, type: ReactionType) => Promise<void>;
  unreactToPost: (postId: string) => Promise<void>;
  updateReaction: (postId: string, type: ReactionType) => Promise<void>;
  fetchReactionsByPost: (postId: string, filters?: GetReactionsFilters) => Promise<void>;
  fetchMyReaction: (postId: string) => Promise<void>;
  fetchCounts: (postId: string) => Promise<void>;

  // Acciones - WebSocket
  addReaction: (reaction: Reaction) => void;
  removeReaction: (postId: string, userId: string) => void;
  updateReactionInList: (reaction: Reaction) => void;
  incrementCount: (postId: string, type: ReactionType) => void;
  decrementCount: (postId: string, type: ReactionType) => void;

  // Utilidades
  clearError: () => void;
  reset: () => void;
}

export const useReactionStore = create<ReactionState>((set, get) => ({
  // Estado inicial
  reactions: [],
  reactionsByPost: {},
  countsByPost: {},
  myReactionsByPost: {},
  isLoading: false,
  error: null,

  // ============================================
  // Acciones - API calls
  // ============================================

  /**
   * Reaccionar a un post
   */
  reactToPost: async (postId: string, type: ReactionType) => {
    try {
      console.log('[REACTION STORE] reactToPost:', postId, type);

      const reaction = await reactionService.react({ postId, type });

      // Actualizar estado local
      set(state => ({
        myReactionsByPost: {
          ...state.myReactionsByPost,
          [postId]: reaction,
        },
      }));

      // Incrementar contador
      get().incrementCount(postId, type);

      console.log('[REACTION STORE] Reacción creada:', reaction);
    } catch (error) {
      console.error('[REACTION STORE] reactToPost - Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al reaccionar';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Quitar reacción de un post
   */
  unreactToPost: async (postId: string) => {
    try {
      console.log('[REACTION STORE] unreactToPost:', postId);

      const currentReaction = get().myReactionsByPost[postId];
      if (!currentReaction) {
        console.warn('[REACTION STORE] No hay reacción para quitar');
        return;
      }

      await reactionService.unreact(postId);

      // Decrementar contador
      get().decrementCount(postId, currentReaction.type);

      // Actualizar estado local
      set(state => ({
        myReactionsByPost: {
          ...state.myReactionsByPost,
          [postId]: null,
        },
      }));

      console.log('[REACTION STORE] Reacción eliminada');
    } catch (error) {
      console.error('[REACTION STORE] unreactToPost - Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al quitar reacción';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Cambiar tipo de reacción
   */
  updateReaction: async (postId: string, type: ReactionType) => {
    try {
      console.log('[REACTION STORE] updateReaction:', postId, type);

      const currentReaction = get().myReactionsByPost[postId];
      if (!currentReaction) {
        // Si no hay reacción actual, crear una nueva
        await get().reactToPost(postId, type);
        return;
      }

      // Decrementar contador anterior
      get().decrementCount(postId, currentReaction.type);

      const reaction = await reactionService.updateReaction(postId, { type });

      // Incrementar nuevo contador
      get().incrementCount(postId, type);

      // Actualizar estado local
      set(state => ({
        myReactionsByPost: {
          ...state.myReactionsByPost,
          [postId]: reaction,
        },
      }));

      console.log('[REACTION STORE] Reacción actualizada:', reaction);
    } catch (error) {
      console.error('[REACTION STORE] updateReaction - Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar reacción';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Obtener todas las reacciones de un post
   */
  fetchReactionsByPost: async (postId: string, filters?: GetReactionsFilters) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[REACTION STORE] fetchReactionsByPost:', postId);

      const response = await reactionService.getByPost(postId, filters);

      set(state => ({
        reactionsByPost: {
          ...state.reactionsByPost,
          [postId]: response.reactions,
        },
        countsByPost: {
          ...state.countsByPost,
          [postId]: response.counts,
        },
        myReactionsByPost: {
          ...state.myReactionsByPost,
          [postId]: response.currentUserReaction,
        },
        isLoading: false,
      }));

      console.log('[REACTION STORE] Reacciones cargadas:', response.reactions.length);
    } catch (error) {
      console.error('[REACTION STORE] fetchReactionsByPost - Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar reacciones';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  /**
   * Obtener mi reacción en un post
   */
  fetchMyReaction: async (postId: string) => {
    try {
      console.log('[REACTION STORE] fetchMyReaction:', postId);

      const reaction = await reactionService.getMyReaction(postId);

      set(state => ({
        myReactionsByPost: {
          ...state.myReactionsByPost,
          [postId]: reaction,
        },
      }));

      console.log('[REACTION STORE] Mi reacción:', reaction);
    } catch (error) {
      console.error('[REACTION STORE] fetchMyReaction - Error:', error);
      // No mostrar toast para este error
    }
  },

  /**
   * Obtener contadores de reacciones
   */
  fetchCounts: async (postId: string) => {
    try {
      console.log('[REACTION STORE] fetchCounts:', postId);

      const counts = await reactionService.getCounts(postId);

      set(state => ({
        countsByPost: {
          ...state.countsByPost,
          [postId]: counts,
        },
      }));

      console.log('[REACTION STORE] Contadores:', counts);
    } catch (error) {
      console.error('[REACTION STORE] fetchCounts - Error:', error);
    }
  },

  // ============================================
  // Acciones - WebSocket
  // ============================================

  /**
   * [WebSocket] Agregar nueva reacción
   */
  addReaction: (reaction: Reaction) => {
    console.log('[REACTION STORE] addReaction:', reaction);

    set(state => {
      const postReactions = state.reactionsByPost[reaction.postId] || [];

      return {
        reactionsByPost: {
          ...state.reactionsByPost,
          [reaction.postId]: [...postReactions, reaction],
        },
      };
    });

    // Incrementar contador
    get().incrementCount(reaction.postId, reaction.type);
  },

  /**
   * [WebSocket] Remover reacción
   */
  removeReaction: (postId: string, userId: string) => {
    console.log('[REACTION STORE] removeReaction:', postId, userId);

    set(state => {
      const postReactions = state.reactionsByPost[postId] || [];
      const removedReaction = postReactions.find(r => r.userId === userId);

      if (!removedReaction) return state;

      return {
        reactionsByPost: {
          ...state.reactionsByPost,
          [postId]: postReactions.filter(r => r.userId !== userId),
        },
      };
    });
  },

  /**
   * [WebSocket] Actualizar reacción existente
   */
  updateReactionInList: (reaction: Reaction) => {
    console.log('[REACTION STORE] updateReactionInList:', reaction);

    set(state => {
      const postReactions = state.reactionsByPost[reaction.postId] || [];

      return {
        reactionsByPost: {
          ...state.reactionsByPost,
          [reaction.postId]: postReactions.map(r =>
            r.userId === reaction.userId ? reaction : r
          ),
        },
      };
    });
  },

  /**
   * [WebSocket] Incrementar contador de reacciones
   */
  incrementCount: (postId: string, type: ReactionType) => {
    set(state => {
      const counts = state.countsByPost[postId] || {
        LIKE: 0,
        LOVE: 0,
        HAHA: 0,
        WOW: 0,
        SAD: 0,
        ANGRY: 0,
      };

      return {
        countsByPost: {
          ...state.countsByPost,
          [postId]: {
            ...counts,
            [type]: counts[type] + 1,
          },
        },
      };
    });
  },

  /**
   * [WebSocket] Decrementar contador de reacciones
   */
  decrementCount: (postId: string, type: ReactionType) => {
    set(state => {
      const counts = state.countsByPost[postId] || {
        LIKE: 0,
        LOVE: 0,
        HAHA: 0,
        WOW: 0,
        SAD: 0,
        ANGRY: 0,
      };

      return {
        countsByPost: {
          ...state.countsByPost,
          [postId]: {
            ...counts,
            [type]: Math.max(0, counts[type] - 1),
          },
        },
      };
    });
  },

  // ============================================
  // Utilidades
  // ============================================

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    console.log('[REACTION STORE] reset');
    set({
      reactions: [],
      reactionsByPost: {},
      countsByPost: {},
      myReactionsByPost: {},
      isLoading: false,
      error: null,
    });
  },
}));
