import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions';
import { loadTimelinePage } from '@/lib/api/timeline-page';
import { loadTimelinePosts } from '@/lib/api/timeline-posts';
import type { Post } from '../interfaces/post.interfaces';

// React cache is scoped to this server render, never shared between viewers.
export const listTimelinePosts = cache(async (limit = 20): Promise<Post[]> => {
  const authUser = await getCachedAuthUser();
  const userId = authUser?.id;
  if (!userId) return [];

  const client = await getServerClient();

  const { data, error } = await loadTimelinePosts(client, userId, limit);
  return error ? [] : data as unknown as Post[];
});

export const listTimelinePage = cache(async () => {
  const user = await getCachedAuthUser();
  if (!user) return undefined;
  try {
    return { ...await loadTimelinePage(await getServerClient(), user.id), viewerId: user.id };
  } catch {
    // The client retries and exposes its recoverable error state.
    return undefined;
  }
});
