import { useEffect } from 'react';
import { insforge } from '@/lib/insforge/client';
import { ensureRealtimeConnected } from '@/lib/insforge/realtime';
import { useCommentStore } from '../store/comment.store';
import { usePostStore } from '@/app/(app)/feed/post/stores/post.store';
import type {
  CommentSocketPayload,
  CommentUpdatedPayload,
  CommentDeletedPayload,
} from '../interfaces/comment.interfaces';

const COMMENT_EVENTS = {
  CREATED: 'comment.created',
  UPDATED: 'comment.updated',
  DELETED: 'comment.deleted',
} as const;

export function channelForPostComments(postId: string): string {
  return `comments:post:${postId}`;
}

/**
 * Subscribes to InsForge Realtime for a post's comment stream and keeps the
 * comment + post stores in sync with events published by comment.service.
 */
export function useCommentSocket(postId: string | null | undefined) {
  const { addComment, updateCommentInList, removeComment } = useCommentStore();
  const { incrementCommentsCount, decrementCommentsCount } = usePostStore();

  useEffect(() => {
    if (!postId) return;

    const myChannel = channelForPostComments(postId);
    let cancelled = false;

    const matchesChannel = (payload: any) => {
      const channel = payload?.meta?.channel ?? '';
      return !channel || channel === myChannel;
    };

    const handleCreated = (payload: CommentSocketPayload & { meta?: { channel?: string } }) => {
      if (!matchesChannel(payload)) return;
      if (payload.postId !== postId) return;
      addComment(payload.comment);
      incrementCommentsCount(payload.postId);
    };

    const handleUpdated = (payload: CommentUpdatedPayload & { meta?: { channel?: string } }) => {
      if (!matchesChannel(payload)) return;
      if (payload.postId !== postId) return;
      updateCommentInList(payload.comment);
    };

    const handleDeleted = (payload: CommentDeletedPayload & { meta?: { channel?: string } }) => {
      if (!matchesChannel(payload)) return;
      if (payload.postId !== postId) return;
      removeComment(payload.commentId, payload.postId);
      decrementCommentsCount(payload.postId);
    };

    insforge.realtime.on(COMMENT_EVENTS.CREATED, handleCreated);
    insforge.realtime.on(COMMENT_EVENTS.UPDATED, handleUpdated);
    insforge.realtime.on(COMMENT_EVENTS.DELETED, handleDeleted);

    (async () => {
      const ok = await ensureRealtimeConnected();
      if (!ok || cancelled) return;
      try {
        await insforge.realtime.subscribe(myChannel);
      } catch {
        // subscribe can fail if the socket dropped between connect and here;
        // ensureRealtimeConnected will retry on the next mount.
      }
    })();

    return () => {
      cancelled = true;
      insforge.realtime.off(COMMENT_EVENTS.CREATED, handleCreated);
      insforge.realtime.off(COMMENT_EVENTS.UPDATED, handleUpdated);
      insforge.realtime.off(COMMENT_EVENTS.DELETED, handleDeleted);
      try {
        insforge.realtime.unsubscribe(myChannel);
      } catch {
        // ignore
      }
    };
  }, [postId, addComment, updateCommentInList, removeComment, incrementCommentsCount, decrementCommentsCount]);
}
