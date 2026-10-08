'use server';

import { z } from 'zod';
import { requireSession } from '../_shared';
import type { DeleteResult } from './types';
import { revalidateCommunityArticlePaths } from './_helpers';

export async function shareCommunityArticleToFeed(articleId: string, message: string, requestId: string): Promise<DeleteResult> {
  if (!z.uuid().safeParse(articleId).success || !z.uuid().safeParse(requestId).success) {
    return { ok: false, error: 'Solicitud inválida.' };
  }
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const { data: row, error: loadError } = await session.client.from('community_articles')
    .select('community_id,author_id,slug,title').eq('id', articleId).eq('is_published', true)
    .is('hidden_at', null).is('deleted_at', null).maybeSingle();
  if (loadError || !row) return { ok: false, error: 'El artículo no está publicado o ya no está disponible.' };
  if (row.author_id !== session.userId) return { ok: false, error: 'Solo el autor puede compartir este artículo.' };
  const trimmed = message.trim().slice(0, 1000);
  const title = row.title.replace(/[\r\n|\]]/g, ' ').slice(0, 200);
  const marker = `[[community-article: ${row.slug}|${title}]]`;
  const body = trimmed ? `${trimmed}\n${marker}` : marker;
  const { error } = await session.client.from('community_posts').insert({
    id: requestId, community_id: row.community_id, author_id: session.userId, body, media: [],
  });
  if (error?.code === '23505') {
    const { data: existing } = await session.client.from('community_posts')
      .select('community_id,author_id,body').eq('id', requestId).maybeSingle();
    if (existing?.community_id === row.community_id && existing?.author_id === session.userId && existing?.body === body) {
      return { ok: true };
    }
  }
  if (error) return { ok: false, error: 'No se pudo compartir el artículo. Inténtalo de nuevo.' };
  revalidateCommunityArticlePaths();
  return { ok: true };
}
