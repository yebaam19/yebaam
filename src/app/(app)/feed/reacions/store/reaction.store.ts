import { create } from 'zustand';
import { createPostsReactionSlice } from './posts.slice';
import { createCommentsReactionSlice } from './comments.slice';
import type { ReactionState } from './reaction-store.types';

/**
 * Reaction store — a single Zustand store composed from two slices via the
 * slices pattern. The public `useReactionStore` hook and its full API are
 * unchanged; the implementation now lives in the sibling slice modules:
 *
 * - {@link ./posts.slice}    — post reactions: lists/counts, API actions, WS mutators, error/reset
 * - {@link ./comments.slice} — comment reactions: per-comment counts + optimistic actions
 *
 * Slice contracts live in {@link ./reaction-store.types}.
 */
export type { ReactionState } from './reaction-store.types';

export const useReactionStore = create<ReactionState>()((...a) => ({
  ...createPostsReactionSlice(...a),
  ...createCommentsReactionSlice(...a),
}));
