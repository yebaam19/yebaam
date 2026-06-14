'use server';

import { requireSession, type ActionResult } from '../_shared';

/** Atomically replace the artist tag list. */
export async function setArticleArtists(
  articleId: string,
  artistIds: string[],
): Promise<ActionResult<{ count: number }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión.' };
  const { client } = session;
  const { error: delErr } = await client
    .from('music_article_artists')
    .delete()
    .eq('article_id', articleId);
  if (delErr) return { ok: false, error: delErr.message };
  if (artistIds.length > 0) {
    const rows = artistIds.map((artist_id) => ({ article_id: articleId, artist_id }));
    const { error } = await client.from('music_article_artists').insert(rows);
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true, data: { count: artistIds.length } };
}

/** Atomically replace the label tag list. Mirrors setArticleArtists. */
export async function setArticleLabels(
  articleId: string,
  labelIds: string[],
): Promise<ActionResult<{ count: number }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión.' };
  const { client } = session;
  const { error: delErr } = await client
    .from('music_article_labels')
    .delete()
    .eq('article_id', articleId);
  if (delErr) return { ok: false, error: delErr.message };
  if (labelIds.length > 0) {
    const rows = labelIds.map((label_id) => ({ article_id: articleId, label_id }));
    const { error } = await client.from('music_article_labels').insert(rows);
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true, data: { count: labelIds.length } };
}
