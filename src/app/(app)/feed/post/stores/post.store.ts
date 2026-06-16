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

export const usePostStore = create<PostState>()((...a) => ({
  ...createFeedSlice(...a),
  ...createComposerSlice(...a),
  ...createMutationsSlice(...a),
}));
