'use server';

import { requireSession, type ActionResult } from '../_shared';

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
