import { getCached, updateCached } from '@/lib/hooks/cacheStore';
import type { Post, ReactionsCount } from '@/app/(app)/feed/post/interfaces/post.interfaces';
import type { ReactionType } from '../interfaces/reaction.interfaces';
import { toDbType } from '../services/reaction.mappers';

type CachedRecord<T> = { data: T; fetchedAt: number };

/** Post-list caches rendered by FeedTimeline (see `usePosts` / `useSuggestedPosts`). */
const POST_LIST_KEYS = ['posts::timeline', 'posts::suggestions'] as const;

function bumpReactionsCount(
  counts: ReactionsCount,
  add: ReactionType | null,
  remove: ReactionType | null,
): ReactionsCount {
  const next: ReactionsCount = { ...counts };
  if (remove) {
    const key = toDbType(remove);
    next[key] = Math.max(0, (next[key] ?? 0) - 1);
  }
  if (add) {
    const key = toDbType(add);
    next[key] = (next[key] ?? 0) + 1;
  }
  return next;
}

/**
 * Mirror the viewer's own reaction delta into the post caches that
 * `ReactionStats` reads (`post.reactionsCount`): the feed lists and the
 * single-post entry (`usePost`). Without this the Like button flips but the
 * count beside it never moves until the next refetch. Only patches entries
 * that already exist and keeps their `fetchedAt`, so a later server refetch
 * still overrides these local bumps.
 */
export function bumpPostReactionsCountInCache(
  postId: string,
  add: ReactionType | null,
  remove: ReactionType | null,
): void {
  const patch = (post: Post): Post =>
    post.id === postId
      ? { ...post, reactionsCount: bumpReactionsCount(post.reactionsCount, add, remove) }
      : post;

  for (const key of POST_LIST_KEYS) {
    const record = getCached<CachedRecord<Post[]>>(key);
    if (!record?.data) continue;
    updateCached<CachedRecord<Post[]>>(key, () => ({ ...record, data: record.data.map(patch) }));
  }

  const postKey = `posts::${postId}`;
  const single = getCached<CachedRecord<Post>>(postKey);
  if (single?.data) {
    updateCached<CachedRecord<Post>>(postKey, () => ({ ...single, data: patch(single.data) }));
  }
}
