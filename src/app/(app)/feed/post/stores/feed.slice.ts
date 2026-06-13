import type { StateCreator } from 'zustand';
import type { Post, ReactionsCount, ReactionType } from '../interfaces/post.interfaces';
import type { FeedSlice, PostState } from './post-store.types';

/**
 * Feed slice: the post list + current post + pagination, the local/WebSocket
 * list mutators (add/update/remove, reaction & comment counters), and the
 * error/reset utilities. `set`/`get` are typed over the full PostState, so the
 * reset can clear composer flags too.
 */
export const createFeedSlice: StateCreator<PostState, [], [], FeedSlice> = (set, get) => ({
  // Estado principal
  posts: [],
  currentPost: null,
  isLoading: false,
  error: null,

  // Paginación
  currentPage: 1,
  hasMore: true,
  totalPosts: 0,

  /**
   * [WebSocket] Agregar nuevo post al feed
   */
  addPostToList: (post: Post) => {
    const safePosts = Array.isArray(get().posts) ? get().posts : [];
    const exists = safePosts.some((p) => p.id === post.id);
    if (exists) return;

    set({
      posts: [post, ...safePosts],
      totalPosts: get().totalPosts + 1,
    });
  },

  /**
   * [WebSocket] Actualizar post existente
   */
  updatePostInList: (postId: string, updates: Partial<Post>) => {
    const safePosts = Array.isArray(get().posts) ? get().posts : [];

    const newPosts = safePosts.map((post) =>
      post.id === postId ? { ...post, ...updates } : post,
    );

    set({ posts: newPosts });

    if (get().currentPost?.id === postId) {
      set({ currentPost: { ...get().currentPost!, ...updates } });
    }
  },

  /**
   * [WebSocket] Remover post del feed
   */
  removePostFromList: (postId: string) => {
    const safePosts = Array.isArray(get().posts) ? get().posts : [];

    set({
      posts: safePosts.filter((post) => post.id !== postId),
    });

    if (get().currentPost?.id === postId) {
      set({ currentPost: null });
    }
  },

  /**
   * [WebSocket] Incrementar contador de una reacción
   */
  incrementReactionCount: (postId: string, reactionType: ReactionType) => {
    const safePosts = Array.isArray(get().posts) ? get().posts : [];
    const reactionKey = reactionType.toLowerCase() as keyof ReactionsCount;

    const newPosts = safePosts.map((post) => {
      if (post.id !== postId) return post;

      const currentCount = post.reactionsCount?.[reactionKey] || 0;
      return {
        ...post,
        reactionsCount: {
          ...post.reactionsCount,
          [reactionKey]: currentCount + 1,
        },
      };
    });

    set({ posts: newPosts });

    // También actualizar currentPost si es el mismo
    if (get().currentPost?.id === postId) {
      const current = get().currentPost!;
      const currentCount = current.reactionsCount?.[reactionKey] || 0;
      set({
        currentPost: {
          ...current,
          reactionsCount: {
            ...current.reactionsCount,
            [reactionKey]: currentCount + 1,
          },
        },
      });
    }
  },

  /**
   * [WebSocket] Decrementar contador de una reacción
   */
  decrementReactionCount: (postId: string, reactionType: ReactionType) => {
    const safePosts = Array.isArray(get().posts) ? get().posts : [];
    const reactionKey = reactionType.toLowerCase() as keyof ReactionsCount;

    const newPosts = safePosts.map((post) => {
      if (post.id !== postId) return post;

      const currentCount = post.reactionsCount?.[reactionKey] || 0;
      return {
        ...post,
        reactionsCount: {
          ...post.reactionsCount,
          [reactionKey]: Math.max(0, currentCount - 1),
        },
      };
    });

    set({ posts: newPosts });

    // También actualizar currentPost si es el mismo
    if (get().currentPost?.id === postId) {
      const current = get().currentPost!;
      const currentCount = current.reactionsCount?.[reactionKey] || 0;
      set({
        currentPost: {
          ...current,
          reactionsCount: {
            ...current.reactionsCount,
            [reactionKey]: Math.max(0, currentCount - 1),
          },
        },
      });
    }
  },

  /**
   * [WebSocket] Establecer reacción del usuario actual
   */
  setCurrentUserReaction: (postId: string, reactionType: ReactionType | null) => {
    const safePosts = Array.isArray(get().posts) ? get().posts : [];

    const newPosts = safePosts.map((post) =>
      post.id === postId ? { ...post, currentUserReaction: reactionType || undefined } : post,
    );

    set({ posts: newPosts });

    // También actualizar currentPost si es el mismo
    if (get().currentPost?.id === postId) {
      set({
        currentPost: {
          ...get().currentPost!,
          currentUserReaction: reactionType || undefined,
        },
      });
    }
  },

  /**
   * Incrementa el contador de comentarios de un post.
   * Se llama cuando se agrega un comentario (local o remoto vía WebSocket).
   */
  incrementCommentsCount: (postId: string) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              commentsCount: (post.commentsCount || 0) + 1,
            }
          : post,
      ),
      currentPost:
        state.currentPost?.id === postId
          ? {
              ...state.currentPost,
              commentsCount: (state.currentPost.commentsCount || 0) + 1,
            }
          : state.currentPost,
    }));
  },

  /**
   * Decrementa el contador de comentarios de un post.
   * Se llama cuando se elimina un comentario (local o remoto vía WebSocket).
   */
  decrementCommentsCount: (postId: string) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              commentsCount: Math.max(0, (post.commentsCount || 0) - 1),
            }
          : post,
      ),
      currentPost:
        state.currentPost?.id === postId
          ? {
              ...state.currentPost,
              commentsCount: Math.max(0, (state.currentPost.commentsCount || 0) - 1),
            }
          : state.currentPost,
    }));
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      posts: [],
      currentPost: null,
      isLoading: false,
      error: null,
      currentPage: 1,
      hasMore: true,
      totalPosts: 0,
      isCreateModalOpen: false,
      isCreating: false,
      isEditModalOpen: false,
      postToEdit: null,
      pendingPostContent: undefined,
    });
  },
});
