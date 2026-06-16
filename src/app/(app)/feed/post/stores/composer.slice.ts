import type { StateCreator } from 'zustand';
import type { Post } from '../interfaces/post.interfaces';
import type { ComposerSlice, PostState } from './post-store.types';

/**
 * Composer slice: the create/edit modal state (+ blog/page context and pending
 * seed content) and the actions that open/close it. Modal actions also clear
 * the feed `error` (shared state), which the slices pattern allows since `set`
 * is typed over the whole PostState.
 */
export const createComposerSlice: StateCreator<PostState, [], [], ComposerSlice> = (set) => ({
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

  openCreateModal: (
    blogId?: string,
    pageId?: string,
    businessId?: string,
    businessName?: string,
    businessSlug?: string
  ) => {
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
});
