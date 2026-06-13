import type {
  CreateCommentDTO,
  CreatePostDTO,
  GetPostsFilters,
  Post,
  ReactionType,
  UpdatePostDTO,
} from '../interfaces/post.interfaces';

/**
 * Slice contracts for the post store. The store is a single Zustand store
 * composed from three slices (feed / composer / mutations) via the slices
 * pattern — each slice's `set`/`get` see the whole {@link PostState}, so
 * cross-slice calls (e.g. a mutation updating feed state + closing the modal)
 * work without any extra wiring.
 */

/** Feed list + current post + the WebSocket/local list mutators, plus the
 *  error/reset utilities (which clear feed and composer state). */
export interface FeedSlice {
  posts: Post[];
  currentPost: Post | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  hasMore: boolean;
  totalPosts: number;

  addPostToList: (post: Post) => void;
  updatePostInList: (postId: string, updates: Partial<Post>) => void;
  removePostFromList: (postId: string) => void;
  incrementReactionCount: (postId: string, reactionType: ReactionType) => void;
  decrementReactionCount: (postId: string, reactionType: ReactionType) => void;
  setCurrentUserReaction: (postId: string, reactionType: ReactionType | null) => void;
  incrementCommentsCount: (postId: string) => void;
  decrementCommentsCount: (postId: string) => void;

  clearError: () => void;
  reset: () => void;
}

/** Create/edit modal + composer state and the actions that drive it. */
export interface ComposerSlice {
  isCreateModalOpen: boolean;
  isCreating: boolean;
  isEditModalOpen: boolean;
  postToEdit: Post | null;
  // Context for creating posts in blogs/pages.
  contextBlogId?: string;
  contextPageId?: string;
  // Pending content used to seed CreatePostModal (e.g. when sharing a pet to
  // feed). Consumed and cleared by the modal on open.
  pendingPostContent?: string;

  openCreateModal: (blogId?: string, pageId?: string) => void;
  closeCreateModal: () => void;
  openEditModal: (post: Post) => void;
  closeEditModal: () => void;
  setPendingPostContent: (content: string | undefined) => void;
}

/** Server-backed mutations (API calls): fetches, create/update/delete,
 *  reactions, comments. */
export interface MutationsSlice {
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
}

export type PostState = FeedSlice & ComposerSlice & MutationsSlice;
