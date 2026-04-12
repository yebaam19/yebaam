/**
 * Post Module - Barrel Export
 * 
 * Punto único de exportación para el módulo de posts.
 * Facilita importaciones limpias en otros módulos.
 * 
 * @example
 * import { usePostStore, PostCard, CreatePostModal } from '@/features/post';
 */

// Store
export { usePostStore } from '../../app/(app)/feed/post/stores/post.store';

// Hooks (TanStack Query)
export { 
  usePosts, 
  useInvalidatePosts, 
  useAddPostToCache, 
  useRemovePostFromCache, 
  useUpdatePostInCache 
} from '../../app/(app)/feed/post/hooks/usePosts';

// Components
export { default as CreatePostModal } from '../../app/(app)/feed/post/components/CreatePostModal';
export { default as EditPostModal } from '../../app/(app)/feed/post/components/EditPostModal';
export { default as DeletePostModal } from '../../app/(app)/feed/post/components/DeletePostModal';
export { default as PostCard } from '../../app/(app)/feed/post/components/PostCard';
export { default as PostList } from '../../app/(app)/feed/post/components/PostList';
export { default as FeedTimeline } from '../../app/(app)/feed/post/components/FeedTimeline';

// Interfaces & Types
export type {
  Post,
  PostAuthor,

  CreatePostDTO,
  UpdatePostDTO,
  CreateReactionDTO,
  CreateCommentDTO,
  PostsResponse,
  GetPostsFilters,
} from '../../app/(app)/feed/post/interfaces/post.interfaces';

export {
  PostType,
  PostVisibility,
  ReactionType,
} from '../../app/(app)/feed/post/interfaces/post.interfaces';

// Validators
export {
  createPostSchema,
  updatePostSchema,
  createReactionSchema,
  createCommentSchema,

  validateFileSize,
  validateFileType,
} from '../../app/(app)/feed/post/validators/post.schemas';

export type {

} from '../../app/(app)/feed/post/validators/post.schemas';
