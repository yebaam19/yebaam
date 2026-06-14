'use server';

import { getServiceClient } from '@/utils/supabase/server';
import { requireSession } from '../_shared';
import type { DeleteResult } from './types';
import { revalidateCommunityArticlePaths } from './_helpers';

/**
 * Share an article into the community feed by creating a `community_posts`
 * row that links back to the article. Members of the community will see the
 * post in their feed. Only the article's author may share it.
 */
export async function shareCommunityArticleToFeed(
  articleId: string,
  message?: string,
): Promise<DeleteResult> {
  const svc = getServiceClient();
  const { data: article } = await svc
    .from('community_articles')
    .select('id, community_id, author_id, slug, title')
    .eq('id', articleId)
    .maybeSingle();
  const row = article as
    | { id: string; community_id: string; author_id: string; slug: string; title: string }
    | null;
  if (!row) return { ok: false, error: 'Artículo no encontrado.' };

  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  if (session.userId !== row.author_id) {
    return { ok: false, error: 'Solo el autor del artículo puede compartirlo.' };
  }

  // Body format: optional author message, then a single marker line at the end
  // that `mapPost` parses to render a rich article preview card. The marker
  // line is intentionally machine-friendly and is stripped from the visible
  // text by the renderer, so users only see their own message.
  //   [[community-article: <slug>|<title>]]
  const trimmedMessage = (message ?? '').trim().slice(0, 1000);
  const safeTitle = row.title.replace(/[\r\n|\]]/g, ' ').slice(0, 200);
  const marker = `[[community-article: ${row.slug}|${safeTitle}]]`;
  const body = trimmedMessage ? `${trimmedMessage}\n${marker}` : marker;

  const { error } = await session.client.from('community_posts').insert({
    community_id: row.community_id,
    author_id: session.userId,
    body,
    media: [],
  });
  if (error) return { ok: false, error: error.message };

  revalidateCommunityArticlePaths();
  return { ok: true };
}
