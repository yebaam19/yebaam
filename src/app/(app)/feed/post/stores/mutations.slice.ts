import type { StateCreator } from 'zustand';
import { toast } from 'sonner';
import type {
  CreateCommentDTO,
  CreatePostDTO,
  GetPostsFilters,
  Post,
  ReactionType,
  UpdatePostDTO,
} from '../interfaces/post.interfaces';
import { postService } from '../services/post.service';
import { updateCached } from '@/lib/hooks/cacheStore';
import { businessPostsUpdater } from '../hooks/usePosts';
import type { MutationsSlice, PostState } from './post-store.types';

const TIMELINE_CACHE_KEY = 'posts::timeline';
type TimelineCache = { data: Post[]; fetchedAt: number };

/**
 * Mutations slice: every server-backed action. Reads/writes feed state and
 * composer flags through the shared store (e.g. createPost closes the create
 * modal; updatePost delegates to feed's updatePostInList), so it depends on the
 * other slices only via the combined PostState.
 */
export const createMutationsSlice: StateCreator<PostState, [], [], MutationsSlice> = (set, get) => ({
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

      // Same mirror, scoped to the business wall — fixes PRA-002: a post created from
      // the admin panel now appears immediately in BusinessSocialFeed (useBusinessPosts),
      // without that component needing its own independent fetch/state.
      if (postForCache.businessId) {
        businessPostsUpdater(postForCache.businessId, (posts) =>
          posts ? [postForCache, ...posts] : [postForCache]
        );
      }

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
      // Capture businessId before removal — needed to mirror the deletion
      // into that business's wall cache below.
      const deletedBusinessId = get().posts.find((p) => p.id === postId)?.businessId;

      await postService.delete(postId);

      get().removePostFromList(postId);
      set({ totalPosts: Math.max(0, get().totalPosts - 1) });

      updateCached<TimelineCache>(TIMELINE_CACHE_KEY, (record) => ({
        data: record?.data ? record.data.filter((p) => p.id !== postId) : [],
        fetchedAt: Date.now(),
      }));

      if (deletedBusinessId) {
        businessPostsUpdater(deletedBusinessId, (posts) =>
          posts ? posts.filter((p) => p.id !== postId) : []
        );
      }

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
});
