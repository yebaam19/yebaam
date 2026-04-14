'use client';

import { create } from 'zustand';
import { toast } from 'sonner';
import { 
  Post, 
  GetPostsFilters, 
  CreatePostDTO, 
  UpdatePostDTO, 
  ReactionType, 
  CreateCommentDTO,
  ReactionsCount
} from '../interfaces/post.interfaces';
import { postService } from '../services/post.service';
import { updateCached } from '@/lib/hooks/cacheStore';

const TIMELINE_CACHE_KEY = 'posts::timeline';
type TimelineCache = { data: Post[]; fetchedAt: number };

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
  
  // Context for creating posts in blogs/pages
  contextBlogId?: string;
  contextPageId?: string;
  
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
  openCreateModal: (blogId?: string, pageId?: string) => void;
  closeCreateModal: () => void;
  openEditModal: (post: Post) => void;
  closeEditModal: () => void;
  
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

  // ============================================
  // Acciones - API calls
  // ============================================

  /**
   * Obtener timeline de posts (feed principal)
   */
  fetchTimeline: async (filters?: GetPostsFilters) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[POST STORE] fetchTimeline - Iniciando...');
      const posts = await postService.getAll(filters);
      console.log('[POST STORE] fetchTimeline - Posts recibidos:', posts.length);
      
      const safePosts = Array.isArray(get().posts) ? get().posts : [];
      const newPosts = filters?.page === 1 ? posts : [...safePosts, ...posts];
      
      set({
        posts: newPosts,
        currentPage: filters?.page || 1,
        hasMore: posts.length >= (filters?.limit || 10),
        totalPosts: filters?.page === 1 ? posts.length : get().totalPosts + posts.length,
        isLoading: false,
      });
      
      console.log('[POST STORE] fetchTimeline - Total posts:', get().posts.length);
    } catch (error) {
      console.error('[POST STORE] fetchTimeline - Error:', error);
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
      console.log('[POST STORE] fetchUserPosts - Usuario:', userId);
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
      console.error('[POST STORE] fetchUserPosts - Error:', error);
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
      console.log('[POST STORE] fetchMyPosts - Iniciando...');
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
      
      console.log('[POST STORE] fetchMyPosts - Total posts:', get().posts.length);
    } catch (error) {
      console.error('[POST STORE] fetchMyPosts - Error:', error);
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
      console.log('[POST STORE] fetchPostById:', postId);
      const post = await postService.getById(postId);
      set({ currentPost: post, isLoading: false });
    } catch (error) {
      console.error('[POST STORE] fetchPostById - Error:', error);
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
      console.log('[POST STORE] createPost - Datos:', data);
      
      const newPost = await postService.create(data);
      console.log('[POST STORE] createPost - Post creado:', newPost.id);
      console.log('[POST STORE] createPost - Post completo:', newPost);
      
      // Agregar al inicio de la lista
      const safePosts = Array.isArray(get().posts) ? get().posts : [];
      console.log('[POST STORE] createPost - Posts actuales:', safePosts.length);
      
      const updatedPosts = [newPost, ...safePosts];
      console.log('[POST STORE] createPost - Posts después de agregar:', updatedPosts.length);
      
      set({
        posts: updatedPosts,
        totalPosts: safePosts.length + 1,
        isCreating: false,
        isCreateModalOpen: false,
      });

      // Also push into the shared cacheStore so FeedTimeline (which reads from
      // usePosts → useFetch → cacheStore) re-renders instantly without reload.
      updateCached<TimelineCache>(TIMELINE_CACHE_KEY, (record) => ({
        data: record?.data ? [newPost, ...record.data] : [newPost],
        fetchedAt: Date.now(),
      }));

      console.log('[POST STORE] createPost - Estado actualizado. Total posts:', get().posts.length);
      toast.success('Post creado exitosamente');
      return newPost;
    } catch (error) {
      console.error('[POST STORE] createPost - Error:', error);
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
      console.log('[POST STORE] updatePost - Actualizando post:', postId);
      console.log('[POST STORE] updatePost - Data:', data);
      
      const updatedPost = await postService.update(postId, data);
      console.log('[POST STORE] updatePost - Post actualizado:', {
        id: updatedPost.id,
        backgroundColor: updatedPost.backgroundColor,
        content: updatedPost.content?.substring(0, 50),
      });

      // Actualizar el post en la lista
      get().updatePostInList(postId, updatedPost);
      
      // Si el currentPost es el mismo que estamos actualizando, refrescarlo también
      if (get().currentPost?.id === postId) {
        console.log('[POST STORE] updatePost - Actualizando currentPost también');
        set({ currentPost: updatedPost });
      }
      
      set({ 
        isLoading: false, 
        isEditModalOpen: false,
        postToEdit: null,
      });
      toast.success('Post actualizado');
    } catch (error) {
      console.error('🔴 [POST STORE] updatePost - Error:', error);
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
      console.log('[POST STORE] deletePost:', postId);
      await postService.delete(postId);
      
      get().removePostFromList(postId);
      set({ totalPosts: Math.max(0, get().totalPosts - 1) });
      
      toast.success('Post eliminado');
    } catch (error) {
      console.error('[POST STORE] deletePost - Error:', error);
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
      console.log('[POST STORE] reactToPost:', postId, reactionType);
      const updatedPost = await postService.react(postId, reactionType);
      get().updatePostInList(postId, updatedPost);
    } catch (error) {
      console.error('[POST STORE] reactToPost - Error:', error);
      toast.error('Error al reaccionar');
      throw error;
    }
  },

  /**
   * Quitar reacción de un post
   */
  unreactToPost: async (postId: string) => {
    try {
      console.log('[POST STORE] unreactToPost:', postId);
      const updatedPost = await postService.unreact(postId);
      get().updatePostInList(postId, updatedPost);
    } catch (error) {
      console.error('[POST STORE] unreactToPost - Error:', error);
      toast.error('Error al quitar reacción');
      throw error;
    }
  },

  /**
   * Comentar en un post
   */
  commentOnPost: async (data: CreateCommentDTO) => {
    try {
      console.log('[POST STORE] commentOnPost:', data.postId);
      await postService.comment(data);
      
      // Recargar el post para obtener el contador actualizado
      const updatedPost = await postService.getById(data.postId);
      get().updatePostInList(data.postId, updatedPost);
      
      toast.success('Comentario agregado');
    } catch (error) {
      console.error('[POST STORE] commentOnPost - Error:', error);
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
    console.log('[POST STORE] addPostToList:', post.id);
    
    const safePosts = Array.isArray(get().posts) ? get().posts : [];
    
    // Verificar si el post ya existe
    const exists = safePosts.some(p => p.id === post.id);
    
    if (exists) {
      console.log('[POST STORE] Post ya existe, ignorando duplicado');
      return;
    }
    
    // Agregar al inicio de la lista
    set({ 
      posts: [post, ...safePosts],
      totalPosts: get().totalPosts + 1,
    });
    
    console.log('[POST STORE] Post agregado. Total:', get().posts.length);
  },

  /**
   * [WebSocket] Actualizar post existente
   */
  updatePostInList: (postId: string, updates: Partial<Post>) => {
    console.log('[POST STORE] updatePostInList:', postId);
    
    const safePosts = Array.isArray(get().posts) ? get().posts : [];
    
    const newPosts = safePosts.map(post =>
      post.id === postId ? { ...post, ...updates } : post
    );
    
    set({ posts: newPosts });
    
    // También actualizar currentPost si es el mismo
    if (get().currentPost?.id === postId) {
      set({ currentPost: { ...get().currentPost!, ...updates } });
    }
  },

  /**
   * [WebSocket] Remover post del feed
   */
  removePostFromList: (postId: string) => {
    console.log('[POST STORE] removePostFromList:', postId);
    
    const safePosts = Array.isArray(get().posts) ? get().posts : [];
    
    set({
      posts: safePosts.filter(post => post.id !== postId),
    });
    
    // También limpiar currentPost si es el mismo
    if (get().currentPost?.id === postId) {
      set({ currentPost: null });
    }
  },

  /**
   * [WebSocket] Incrementar contador de una reacción
   */
  incrementReactionCount: (postId: string, reactionType: ReactionType) => {
    console.log('[POST STORE] incrementReactionCount:', postId, reactionType);
    
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
    console.log('[POST STORE] decrementReactionCount:', postId, reactionType);
    
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
    console.log('[POST STORE] setCurrentUserReaction:', postId, reactionType);
    
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

  openCreateModal: (blogId?: string, pageId?: string) => {
    console.log('[POST STORE] openCreateModal', { blogId, pageId });
    set({ 
      isCreateModalOpen: true, 
      error: null,
      contextBlogId: blogId,
      contextPageId: pageId,
    });
  },

  closeCreateModal: () => {
    console.log('[POST STORE] closeCreateModal');
    set({ 
      isCreateModalOpen: false, 
      error: null,
      contextBlogId: undefined,
      contextPageId: undefined,
    });
  },

  openEditModal: (post: Post) => {
    console.log('[POST STORE] openEditModal:', post.id);
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
    });

  },
}));
