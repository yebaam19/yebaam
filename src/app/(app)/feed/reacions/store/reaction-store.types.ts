import type {
  GetReactionsFilters,
  Reaction,
  ReactionCounts,
  ReactionType,
} from '../interfaces/reaction.interfaces';

/**
 * Slice contracts for the reaction store. The store is a single Zustand store
 * composed from two slices (posts / comments) via the slices pattern — each
 * slice's `set`/`get` see the whole {@link ReactionState}, so cross-slice calls
 * (e.g. `reset()` clearing both post and comment state) work without extra
 * wiring.
 */

/** Post reactions: the cached reaction lists/counts/my-reaction maps, the
 *  server-backed post actions, the WebSocket/local list mutators + counters,
 *  and the shared `isLoading`/`error` + `clearError`/`reset` utilities (which
 *  also clear comment state). */
export interface PostsReactionSlice {
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
  fetchMyReactionsForPosts: (postIds: string[]) => Promise<void>;
  fetchCounts: (postId: string) => Promise<void>;
  /** Fill `myReactionsByPost` from server-shipped `post.currentUserReaction`
   *  (accepts the post module's enum values); never overwrites known ids. */
  seedMyReactions: (
    userId: string,
    entries: ReadonlyArray<{ postId: string; type: `${ReactionType}` | null | undefined }>,
  ) => void;

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

/** Comment reactions: the per-comment counts/my-reaction maps and the
 *  optimistic comment actions (same `reactions` table, `comment_id` branch). */
export interface CommentsReactionSlice {
  countsByComment: Record<string, ReactionCounts>;
  myReactionsByComment: Record<string, Reaction | null>;

  reactToComment: (commentId: string, type: ReactionType) => Promise<void>;
  unreactComment: (commentId: string) => Promise<void>;
  updateCommentReaction: (commentId: string, type: ReactionType) => Promise<void>;
  fetchMyReactionsForComments: (commentIds: string[]) => Promise<void>;
  fetchCountsForComments: (commentIds: string[]) => Promise<void>;
}

export type ReactionState = PostsReactionSlice & CommentsReactionSlice;
