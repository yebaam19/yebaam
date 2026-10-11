import 'server-only';
import type { getServerClient } from '@/utils/supabase/server';
import type { TimelineCursor, TimelinePage } from '@/app/(app)/feed/post/interfaces/timeline.interfaces';
import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces';
import type { PostRow } from './posts';
import { hydrateTimelineRows } from './timeline-posts';

export async function loadTimelinePage(
  client: Awaited<ReturnType<typeof getServerClient>>,
  userId: string,
  cursor: TimelineCursor | null = null,
  limit = 20,
): Promise<TimelinePage> {
  const pageSize = Math.min(Math.max(Math.trunc(limit) || 20, 1), 100);
  const { data, error } = await client.rpc('get_timeline_posts_page', {
    p_limit: pageSize + 1,
    p_before_created_at: cursor?.createdAt ?? null,
    p_before_id: cursor?.id ?? null,
  });
  if (error) throw new Error('Unable to load timeline', { cause: error });
  const rows = (data ?? []) as PostRow[];
  const pageRows = rows.slice(0, pageSize);
  const result = await hydrateTimelineRows(client, userId, pageRows);
  if (result.error) throw new Error('Unable to verify timeline visibility', { cause: result.error });
  const last = pageRows.at(-1);
  return {
    posts: result.data as unknown as Post[],
    // Advance over scanned rows even when RLS removes some of this page.
    nextCursor: rows.length > pageSize && last ? { createdAt: last.created_at, id: last.id } : null,
  };
}
