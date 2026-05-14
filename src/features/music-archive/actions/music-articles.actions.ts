'use server';

import { revalidatePath } from 'next/cache';
import { musicSlug, requireSession, type ActionResult } from './_shared';
import type { MusicArticleRow } from '../types/music.types';

interface CreateArticleDto {
  clubId: string;
  title: string;
  subtitle?: string | null;
  content?: string;
  summary?: string | null;
  cfImageId?: string | null;
  tags?: string[];
  artistIds?: string[];
  labelIds?: string[];
  publish?: boolean;
}

interface UpdateArticleDto {
  title?: string;
  subtitle?: string | null;
  content?: string;
  summary?: string | null;
  cfImageId?: string | null;
  tags?: string[];
  publish?: boolean | null; // true → publish, false → unpublish, null → no change
}

/** Resolve a unique article slug within the club scope by appending -2, -3, etc. */
async function uniqueArticleSlug(
  client: Awaited<ReturnType<typeof import('@/utils/supabase/server').getServerClient>>,
  clubId: string,
  base: string,
  ignoreId?: string,
): Promise<string> {
  const baseSlug = musicSlug(base);
  let candidate = baseSlug;
  for (let i = 0; i < 20; i++) {
    const { data } = await client
      .from('music_articles')
      .select('id')
      .eq('club_id', clubId)
      .eq('slug', candidate)
      .limit(1);
    const rows = (data ?? []) as Array<{ id: string }>;
    if (rows.length === 0 || (ignoreId && rows[0].id === ignoreId)) return candidate;
    candidate = `${baseSlug}-${i + 2}`;
  }
  return `${baseSlug}-${Date.now()}`;
}

export async function createMusicArticle(
  dto: CreateArticleDto,
): Promise<ActionResult<MusicArticleRow & { slug: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión para escribir un artículo.' };
  const { client, userId } = session;

  // Must at least be a member of the club to publish into it.
  const { data: cm } = await client
    .from('club_members')
    .select('role')
    .eq('club_id', dto.clubId)
    .eq('user_id', userId)
    .maybeSingle();
  const { data: pa } = await client
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (!cm && !pa) {
    return { ok: false, error: 'Debes ser miembro del club para escribir un artículo.' };
  }

  const title = dto.title.trim();
  if (!title) return { ok: false, error: 'El título es obligatorio.' };
  const slug = await uniqueArticleSlug(client, dto.clubId, title);

  const { data, error } = await client
    .from('music_articles')
    .insert({
      club_id: dto.clubId,
      author_id: userId,
      slug,
      title,
      subtitle: dto.subtitle?.trim() || null,
      content: dto.content ?? '',
      summary: dto.summary?.trim() || null,
      cf_image_id: dto.cfImageId || null,
      tags: dto.tags ?? [],
      published_at: dto.publish ? new Date().toISOString() : null,
    })
    .select('*')
    .single();
  if (error) return { ok: false, error: error.message };
  const row = data as MusicArticleRow;

  if (dto.artistIds && dto.artistIds.length > 0) {
    const junctionRows = dto.artistIds.map((artist_id) => ({ article_id: row.id, artist_id }));
    const { error: jErr } = await client.from('music_article_artists').insert(junctionRows);
    if (jErr) return { ok: false, error: jErr.message };
  }

  if (dto.labelIds && dto.labelIds.length > 0) {
    const junctionRows = dto.labelIds.map((label_id) => ({ article_id: row.id, label_id }));
    const { error: jErr } = await client.from('music_article_labels').insert(junctionRows);
    if (jErr) return { ok: false, error: jErr.message };
  }

  const { data: c } = await client
    .from('clubs')
    .select('slug')
    .eq('id', dto.clubId)
    .maybeSingle();
  const clubSlug = (c as { slug: string } | null)?.slug;
  if (clubSlug) {
    revalidatePath(`/musica/clubes/${clubSlug}/articulos`);
    revalidatePath(`/musica/clubes/${clubSlug}/articulos/${row.slug}`);
  }
  return { ok: true, data: row };
}

export async function updateMusicArticle(
  articleId: string,
  patch: UpdateArticleDto,
): Promise<ActionResult<MusicArticleRow>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión.' };
  const { client } = session;

  // Fetch current row for slug/club_id (for revalidation) — RLS will reject
  // unauthorized updates downstream anyway.
  const { data: existing } = await client
    .from('music_articles')
    .select('id, club_id, slug, title')
    .eq('id', articleId)
    .maybeSingle();
  if (!existing) return { ok: false, error: 'Artículo no encontrado.' };
  const e = existing as { id: string; club_id: string | null; slug: string; title: string };

  const updates: Record<string, unknown> = {};
  if (patch.title !== undefined) {
    const t = patch.title.trim();
    if (!t) return { ok: false, error: 'El título no puede estar vacío.' };
    updates.title = t;
    if (t !== e.title && e.club_id) {
      updates.slug = await uniqueArticleSlug(client, e.club_id, t, articleId);
    }
  }
  if (patch.subtitle !== undefined) updates.subtitle = patch.subtitle?.trim() || null;
  if (patch.content !== undefined) updates.content = patch.content;
  if (patch.summary !== undefined) updates.summary = patch.summary?.trim() || null;
  if (patch.cfImageId !== undefined) updates.cf_image_id = patch.cfImageId || null;
  if (patch.tags !== undefined) updates.tags = patch.tags;
  if (patch.publish === true) updates.published_at = new Date().toISOString();
  if (patch.publish === false) updates.published_at = null;

  const { data, error } = await client
    .from('music_articles')
    .update(updates)
    .eq('id', articleId)
    .select('*')
    .single();
  if (error) return { ok: false, error: error.message };

  if (e.club_id) {
    const { data: c } = await client
      .from('clubs')
      .select('slug')
      .eq('id', e.club_id)
      .maybeSingle();
    const clubSlug = (c as { slug: string } | null)?.slug;
    if (clubSlug) {
      revalidatePath(`/musica/clubes/${clubSlug}/articulos`);
      revalidatePath(`/musica/clubes/${clubSlug}/articulos/${e.slug}`);
      if (updates.slug) revalidatePath(`/musica/clubes/${clubSlug}/articulos/${updates.slug as string}`);
    }
  }
  return { ok: true, data: data as MusicArticleRow };
}

export async function deleteMusicArticle(articleId: string): Promise<ActionResult<{ removed: true }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión.' };
  const { client } = session;
  const { data: existing } = await client
    .from('music_articles')
    .select('club_id, slug')
    .eq('id', articleId)
    .maybeSingle();
  const { error } = await client.from('music_articles').delete().eq('id', articleId);
  if (error) return { ok: false, error: error.message };
  const e = existing as { club_id: string | null; slug: string } | null;
  if (e?.club_id) {
    const { data: c } = await client
      .from('clubs')
      .select('slug')
      .eq('id', e.club_id)
      .maybeSingle();
    const clubSlug = (c as { slug: string } | null)?.slug;
    if (clubSlug) revalidatePath(`/musica/clubes/${clubSlug}/articulos`);
  }
  return { ok: true, data: { removed: true } };
}

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

/** Convenience for the editor's autocomplete: search labels by name. */
export async function searchLabelsForTag(
  query: string,
): Promise<ActionResult<Array<{ id: string; name: string; slug: string }>>> {
  const q = query.trim();
  if (q.length < 2) return { ok: true, data: [] };
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión.' };
  const { data, error } = await session.client
    .from('music_labels')
    .select('id, name, slug')
    .ilike('name', `%${q}%`)
    .order('name', { ascending: true })
    .limit(20);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as Array<{ id: string; name: string; slug: string }> };
}

/** Convenience for the editor's autocomplete: search artists by name. Public
 *  read — no auth required. */
export async function searchArtistsForTag(
  query: string,
): Promise<ActionResult<Array<{ id: string; name: string; slug: string }>>> {
  const q = query.trim();
  if (q.length < 2) return { ok: true, data: [] };
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión.' };
  const { data, error } = await session.client
    .from('music_artists')
    .select('id, name, slug')
    .ilike('name', `%${q}%`)
    .order('name', { ascending: true })
    .limit(20);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as Array<{ id: string; name: string; slug: string }> };
}

