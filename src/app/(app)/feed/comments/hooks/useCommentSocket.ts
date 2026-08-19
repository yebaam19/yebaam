import { useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime';
import { withImageVariant } from '@/lib/media/urls';
import { useCommentStore } from '../store/comment.store';
import { usePostStore } from '@/app/(app)/feed/post/stores/post.store';
import type { Comment, CommentAuthor } from '../interfaces/comment.interfaces';

export function channelForPostComments(postId: string): string {
  return `comments:post:${postId}`;
}

type DbCommentRow = {
  id: string;
  post_id: string;
  parent_comment_id: string | null;
  author_id: string;
  content: string;
  likes_count: number;
  replies_count: number;
  is_edited: boolean;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
};

type DbProfileRow = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

// Tiny per-tab cache so we don't refetch the same author's profile for
// every comment they make in a session.
const profileCache = new Map<string, CommentAuthor>();

async function getAuthor(userId: string): Promise<CommentAuthor> {
  const cached = profileCache.get(userId);
  if (cached) return cached;
  const { data } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();
  const row = (data as DbProfileRow | null) ?? null;
  const author: CommentAuthor = {
    id: userId,
    username: row?.username ?? '',
    firstName: row?.first_name ?? '',
    lastName: row?.last_name ?? '',
    avatar: row?.avatar_url ? withImageVariant(row.avatar_url, 'avatar') : null,
  };
  profileCache.set(userId, author);
  return author;
}

async function rowToComment(row: DbCommentRow): Promise<Comment> {
  return {
    id: row.id,
    postId: row.post_id,
    content: row.content,
    author: await getAuthor(row.author_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    parentId: row.parent_comment_id,
    isEdited: row.is_edited,
    editedAt: row.edited_at ?? undefined,
    likesCount: row.likes_count,
    repliesCount: row.replies_count,
  };
}

/**
 * Subscribes to Supabase Realtime postgres_changes on the `comments` table
 * filtered by post_id, and keeps the comment + post stores in sync. Replaces
 * the old pub/sub model — senders just INSERT/UPDATE/DELETE the row and
 * every subscriber watching the same filter gets the change for free.
 */
export function useCommentSocket(postId: string | null | undefined) {
  const { addComment, updateCommentInList, removeComment } = useCommentStore();
  const { incrementCommentsCount, decrementCommentsCount } = usePostStore();

  useEffect(() => {
    if (!postId) return;

    const channel = subscribeToTable<DbCommentRow>({
      channel: channelForPostComments(postId),
      table: 'comments',
      filter: `post_id=eq.${postId}`,
      onChange: (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = payload.new as DbCommentRow;
          if (!row?.id) return;
          void rowToComment(row).then((comment) => {
            addComment(comment);
            incrementCommentsCount(row.post_id);
          });
          return;
        }
        if (payload.eventType === 'UPDATE') {
          const row = payload.new as DbCommentRow;
          if (!row?.id) return;
          void rowToComment(row).then((comment) => updateCommentInList(comment));
          return;
        }
        if (payload.eventType === 'DELETE') {
          const row = payload.old as DbCommentRow;
          if (!row?.id) return;
          removeComment(row.id, row.post_id, row.parent_comment_id ?? undefined);
          decrementCommentsCount(row.post_id);
        }
      },
    });

    return () => unsubscribe(channel);
  }, [
    postId,
    addComment,
    updateCommentInList,
    removeComment,
    incrementCommentsCount,
    decrementCommentsCount,
  ]);
}
