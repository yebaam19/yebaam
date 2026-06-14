import type { StateCreator } from 'zustand';
import { toast } from 'sonner';
import type { Reaction } from '../interfaces/reaction.interfaces';
import { reactionService } from '../services/reaction.service';
import { bumpCount } from './reaction.counts';
import type { CommentsReactionSlice, ReactionState } from './reaction-store.types';

/**
 * Comments slice of the reaction store: the per-comment counts/my-reaction
 * maps and the optimistic comment actions. Same `reactions` table as posts,
 * keyed on `comment_id`. `set`/`get` are typed over the full
 * {@link ReactionState}.
 */
export const createCommentsReactionSlice: StateCreator<
  ReactionState,
  [],
  [],
  CommentsReactionSlice
> = (set, get) => ({
  countsByComment: {},
  myReactionsByComment: {},

  reactToComment: async (commentId, type) => {
    const prev = get().myReactionsByComment[commentId] ?? null;

    const optimistic: Reaction = {
      id: prev?.id ?? `optimistic-${commentId}`,
      postId: '',
      commentId,
      userId: prev?.userId ?? 'me',
      type,
      createdAt: prev?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      myReactionsByComment: { ...state.myReactionsByComment, [commentId]: optimistic },
      countsByComment: bumpCount(state.countsByComment, commentId, type, prev?.type ?? null),
    }));

    try {
      const reaction = await reactionService.reactToComment(commentId, type);
      set((state) => ({
        myReactionsByComment: { ...state.myReactionsByComment, [commentId]: reaction },
      }));
    } catch (error) {
      set((state) => ({
        myReactionsByComment: { ...state.myReactionsByComment, [commentId]: prev },
        countsByComment: bumpCount(state.countsByComment, commentId, prev?.type ?? null, type),
      }));
      const errorMessage = error instanceof Error ? error.message : 'Error al reaccionar';
      toast.error(errorMessage);
    }
  },

  unreactComment: async (commentId) => {
    const prev = get().myReactionsByComment[commentId];
    if (!prev) return;

    set((state) => ({
      myReactionsByComment: { ...state.myReactionsByComment, [commentId]: null },
      countsByComment: bumpCount(state.countsByComment, commentId, null, prev.type),
    }));

    try {
      await reactionService.unreactComment(commentId);
    } catch (error) {
      set((state) => ({
        myReactionsByComment: { ...state.myReactionsByComment, [commentId]: prev },
        countsByComment: bumpCount(state.countsByComment, commentId, prev.type, null),
      }));
      const errorMessage = error instanceof Error ? error.message : 'Error al quitar reacción';
      toast.error(errorMessage);
    }
  },

  updateCommentReaction: async (commentId, type) => {
    const prev = get().myReactionsByComment[commentId];
    if (!prev) {
      await get().reactToComment(commentId, type);
      return;
    }
    if (prev.type === type) return;
    await get().reactToComment(commentId, type);
  },

  fetchMyReactionsForComments: async (commentIds) => {
    if (commentIds.length === 0) return;
    const cached = get().myReactionsByComment;
    const missing = commentIds.filter((id) => !(id in cached));
    if (missing.length === 0) return;
    try {
      const reactions = await reactionService.getMyReactionsForComments(missing);
      set((state) => ({
        myReactionsByComment: { ...state.myReactionsByComment, ...reactions },
      }));
    } catch {
      // silent
    }
  },

  fetchCountsForComments: async (commentIds) => {
    if (commentIds.length === 0) return;
    try {
      const counts = await reactionService.getCountsForComments(commentIds);
      set((state) => ({
        countsByComment: { ...state.countsByComment, ...counts },
      }));
    } catch {
      // silent
    }
  },
});
