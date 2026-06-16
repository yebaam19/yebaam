'use client';

import { create } from 'zustand';
import { createFeedSlice } from './feed.slice';
import { createComposerSlice } from './composer.slice';
import { createMutationsSlice } from './mutations.slice';
import type { PostState } from './post-store.types';

/**
 * Post store — a single Zustand store composed from three slices via the
 * slices pattern. The public `usePostStore` hook and its full API are
 * unchanged; the implementation now lives in the sibling slice modules:
 *
 * - {@link ./feed.slice}      — feed list, current post, pagination, WS/local list mutators, error/reset
 * - {@link ./composer.slice}  — create/edit modal + composer state and actions
 * - {@link ./mutations.slice} — server-backed mutations (fetch/create/update/delete/react/comment)
 *
 * Slice contracts live in {@link ./post-store.types}.
 */
export type { PostState } from './post-store.types';

<<<<<<< HEAD
export const usePostStore = create<PostState>()((...a) => ({
  ...createFeedSlice(...a),
  ...createComposerSlice(...a),
  ...createMutationsSlice(...a),
=======
interface PostState {
  // Estado principal
  posts: Post[];
  currentPost: Post | null;
  isLoading: boolean;
  error: string | null;
  
  // Paginación
  currentPage: number;
  hasMore: boolean;
  totalPosts: number;
  
  // Estado del editor
  isCreateModalOpen: boolean;
  isCreating: boolean;
  isEditModalOpen: boolean;
  postToEdit: Post | null;
  
  // Context for creating posts in blogs/pages/businesses
  contextBlogId?: string;
  contextPageId?: string;
  contextBusinessId?: string;
  contextBusinessName?: string;
  contextBusinessSlug?: string;

  // Pending content used to seed CreatePostModal (e.g. when sharing a pet to feed).
  // Consumed and cleared by the modal on open.
  pendingPostContent?: string;


  // Acciones - API calls
  fetchTimeline: (filters?: GetPostsFilters) => Promise<void>;
  fetchUserPosts: (userId: string, filters?: GetPostsFilters) => Promise<void>;
  fetchMyPosts: (filters?: GetPostsFilters) => Promise<void>;
  fetchPostById: (postId: string) => Promise<void>;
  createPost: (data: CreatePostDTO) => Promise<Post | null>;
  updatePost: (postId: string, data: UpdatePostDTO) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  reactToPost: (postId: string, reactionType: ReactionType) => Promise<void>;
  unreactToPost: (postId: string) => Promise<void>;
  commentOnPost: (data: CreateCommentDTO) => Promise<void>;
  
  // Acciones - WebSocket (Reacciones)
  addPostToList: (post: Post) => void;
  updatePostInList: (postId: string, updates: Partial<Post>) => void;
  removePostFromList: (postId: string) => void;
  incrementReactionCount: (postId: string, reactionType: ReactionType) => void;
  decrementReactionCount: (postId: string, reactionType: ReactionType) => void;
  setCurrentUserReaction: (postId: string, reactionType: ReactionType | null) => void;
  
  // Acciones - WebSocket (Comentarios)
  incrementCommentsCount: (postId: string) => void;
  decrementCommentsCount: (postId: string) => void;
  
  // Acciones - Modal
  openCreateModal: (blogId?: string, pageId?: string, businessId?: string, businessName?: string, businessSlug?: string) => void;
  closeCreateModal: () => void;
  openEditModal: (post: Post) => void;
  closeEditModal: () => void;
  setPendingPostContent: (content: string | undefined) => void;
  
  // Utilidades
  clearError: () => void;
  reset: () => void;
}

export const usePostStore = create<PostState>((set, get) => ({
  // Estado inicial
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
  contextBlogId: undefined,
  contextPageId: undefined,
  contextBusinessId: undefined,
  contextBusinessName: undefined,
  contextBusinessSlug: undefined,
  pendingPostContent: undefined,

  // ============================================
  // Acciones - API calls
  // ============================================

  /**
   * Obtener timeline de posts (feed principal)
   */
  fetchTimeline: async (filters?: GetPostsFilters) => {
    set({ isLoading: true, error: null });
    try {
      const posts = await postService.getAll(filters);
      const safePosts = Array.isArray(get().posts) ? get().posts : [];
      const newPosts = filters?.page === 1 ? posts : [...safePosts, ...posts];

      set({
        posts: newPosts,
        currentPage: filters?.page || 1,
        hasMore: posts.length >= (filters?.limit || 10),
        totalPosts: filters?.page === 1 ? posts.length : get().totalPosts + posts.length,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar posts';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  /**
   * Obtener posts de un usuario específico
   */
  fetchUserPosts: async (userId: string, filters?: GetPostsFilters) => {
    set({ isLoading: true, error: null });
    try {
      const posts = await postService.getUserPosts(userId, filters);
      const safePosts = Array.isArray(get().posts) ? get().posts : [];
      const newPosts = filters?.page === 1 ? posts : [...safePosts, ...posts];

      set({
        posts: newPosts,
        currentPage: filters?.page || 1,
        hasMore: posts.length >= (filters?.limit || 10),
        totalPosts: filters?.page === 1 ? posts.length : get().totalPosts + posts.length,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar posts del usuario';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  /**
   * Obtener mis posts
   */
  fetchMyPosts: async (filters?: GetPostsFilters) => {
    set({ isLoading: true, error: null });
    try {
      const posts = await postService.getMyPosts(filters);
      const safePosts = Array.isArray(get().posts) ? get().posts : [];
      const newPosts = filters?.page === 1 ? posts : [...safePosts, ...posts];

      set({
        posts: newPosts,
        currentPage: filters?.page || 1,
        hasMore: posts.length >= (filters?.limit || 10),
        totalPosts: filters?.page === 1 ? posts.length : get().totalPosts + posts.length,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar tus posts';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  /**
   * Obtener un post por ID
   */
  fetchPostById: async (postId: string) => {
    set({ isLoading: true, error: null });
    try {
      const post = await postService.getById(postId);
      set({ currentPost: post, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar post';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  /**
   * Crear nuevo post
   */
  createPost: async (data: CreatePostDTO) => {
    set({ isCreating: true, error: null });
    try {
      const newPost = await postService.create(data);

      // Enrich business posts with name/slug so the badge renders correctly
      // on optimistic insert. The API response omits these because public.posts
      // has no business_name column — only get_timeline_posts RPC returns them.
      const { contextBusinessName, contextBusinessSlug } = get();
      const postForCache =
        newPost.businessId && contextBusinessName
          ? { ...newPost, businessName: contextBusinessName, businessSlug: contextBusinessSlug }
          : newPost;

      const safePosts = Array.isArray(get().posts) ? get().posts : [];
      const updatedPosts = [postForCache, ...safePosts];

      set({
        posts: updatedPosts,
        totalPosts: safePosts.length + 1,
        isCreating: false,
        isCreateModalOpen: false,
      });

      // Mirror into shared cache so FeedTimeline (usePosts → useFetch → cacheStore) re-renders.
      updateCached<TimelineCache>(TIMELINE_CACHE_KEY, (record) => ({
        data: record?.data ? [postForCache, ...record.data] : [postForCache],
        fetchedAt: Date.now(),
      }));

      toast.success('Post creado exitosamente');
      return newPost;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear post';
      set({ error: errorMessage, isCreating: false });
      toast.error(errorMessage);
      return null;
    }
  },

  /**
   * Actualizar post existente
   */
  updatePost: async (postId: string, data: UpdatePostDTO) => {
    set({ isLoading: true, error: null });
    try {
      const updatedPost = await postService.update(postId, data);

      get().updatePostInList(postId, updatedPost);

      if (get().currentPost?.id === postId) {
        set({ currentPost: updatedPost });
      }

      set({
        isLoading: false,
        isEditModalOpen: false,
        postToEdit: null,
      });
      toast.success('Post actualizado');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar post';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage);
    }
  },

  /**
   * Eliminar post
   */
  deletePost: async (postId: string) => {
    try {
      await postService.delete(postId);

      get().removePostFromList(postId);
      set({ totalPosts: Math.max(0, get().totalPosts - 1) });

      updateCached<TimelineCache>(TIMELINE_CACHE_KEY, (record) => ({
        data: record?.data ? record.data.filter((p) => p.id !== postId) : [],
        fetchedAt: Date.now(),
      }));

      toast.success('Post eliminado');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar post';
      toast.error(errorMessage);
      throw error;
    }
  },

  /**
   * Reaccionar a un post
   */
  reactToPost: async (postId: string, reactionType: ReactionType) => {
    try {
      const updatedPost = await postService.react(postId, reactionType);
      get().updatePostInList(postId, updatedPost);
    } catch (error) {
      toast.error('Error al reaccionar');
      throw error;
    }
  },

  unreactToPost: async (postId: string) => {
    try {
      const updatedPost = await postService.unreact(postId);
      get().updatePostInList(postId, updatedPost);
    } catch (error) {
      toast.error('Error al quitar reacción');
      throw error;
    }
  },

  commentOnPost: async (data: CreateCommentDTO) => {
    try {
      await postService.comment(data);

      const updatedPost = await postService.getById(data.postId);
      get().updatePostInList(data.postId, updatedPost);

      toast.success('Comentario agregado');
    } catch (error) {
      toast.error('Error al comentar');
      throw error;
    }
  },

  // ============================================
  // Acciones - WebSocket
  // ============================================

  /**
   * [WebSocket] Agregar nuevo post al feed
   */
  addPostToList: (post: Post) => {
    const safePosts = Array.isArray(get().posts) ? get().posts : [];
    const exists = safePosts.some(p => p.id === post.id);
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

    const newPosts = safePosts.map(post =>
      post.id === postId ? { ...post, ...updates } : post
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
      posts: safePosts.filter(post => post.id !== postId),
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
    const reactionKey = reactionType.toLowerCase();
    
    const newPosts = safePosts.map(post => {
      if (post.id !== postId) return post;
      
      const currentCount = (post.reactionsCount as any)?.[reactionKey] || 0;
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
      const currentCount = (current.reactionsCount as any)?.[reactionKey] || 0;
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
    const reactionKey = reactionType.toLowerCase();
    
    const newPosts = safePosts.map(post => {
      if (post.id !== postId) return post;
      
      const currentCount = (post.reactionsCount as any)?.[reactionKey] || 0;
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
      const currentCount = (current.reactionsCount as any)?.[reactionKey] || 0;
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
    
    const newPosts = safePosts.map(post =>
      post.id === postId ? { ...post, currentUserReaction: reactionType || undefined } : post
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

  // ============================================
  // Acciones - Modal
  // ============================================

  openCreateModal: (blogId?: string, pageId?: string, businessId?: string, businessName?: string, businessSlug?: string) => {
    set({
      isCreateModalOpen: true,
      error: null,
      contextBlogId: blogId,
      contextPageId: pageId,
      contextBusinessId: businessId,
      contextBusinessName: businessName,
      contextBusinessSlug: businessSlug,
    });
  },

  closeCreateModal: () => {
    set({
      isCreateModalOpen: false,
      error: null,
      contextBlogId: undefined,
      contextPageId: undefined,
      contextBusinessId: undefined,
      contextBusinessName: undefined,
      contextBusinessSlug: undefined,
      pendingPostContent: undefined,
    });
  },

  setPendingPostContent: (content: string | undefined) => {
    set({ pendingPostContent: content });
  },

  openEditModal: (post: Post) => {
    set({
      isEditModalOpen: true,
      postToEdit: post,
      error: null,
    });
  },

  closeEditModal: () => {

    set({ 
      isEditModalOpen: false, 
      postToEdit: null,
      error: null,
    });
  },

  // ============================================
  // Acciones - WebSocket (Comentarios)
  // ============================================

  /**
   * Incrementa el contador de comentarios de un post
   * Se llama cuando se agrega un comentario (local o remoto vía WebSocket)
   */
  incrementCommentsCount: (postId: string) => {
  
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              commentsCount: (post.commentsCount || 0) + 1,
            }
          : post
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
   * Decrementa el contador de comentarios de un post
   * Se llama cuando se elimina un comentario (local o remoto vía WebSocket)
   */
  decrementCommentsCount: (postId: string) => {

    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              commentsCount: Math.max(0, (post.commentsCount || 0) - 1),
            }
          : post
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

  // ============================================
  // Utilidades
  // ============================================

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
      contextBlogId: undefined,
      contextPageId: undefined,
      contextBusinessId: undefined,
      pendingPostContent: undefined,
    });

  },
>>>>>>> a6c4ca7 (feat(business): work in progress before sync)
}));
