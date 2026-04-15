/**
 * Barrel exports para el módulo de Posts
 */

// Servicios
export { postService, PostService } from './services/post.service';

// Interfaces principales
export type {
  Post,
  CreatePostDTO,
  UpdatePostDTO,
  GetPostsFilters,
  ReactionType,
  CreateCommentDTO,
} from './interfaces/post.interfaces';

// Stores
export { usePostStore } from './stores/post.store';

// Hooks
export { usePostSocket } from './hooks/usePostSocket';
export { 
  usePosts, 
  useInvalidatePosts, 
  useAddPostToCache, 
  useRemovePostFromCache, 
  useUpdatePostInCache 
} from './hooks/usePosts';

// Componentes
export { default as PostCard } from './components/PostCard';
export { default as FeedTimeline } from './components/FeedTimeline';
