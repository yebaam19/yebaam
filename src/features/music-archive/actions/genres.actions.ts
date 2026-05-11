'use server';

import { revalidatePath } from 'next/cache';
import { getServiceClient } from '@/utils/supabase/server';
import { adminGate, musicSlug, type ActionResult } from './_shared';

export interface MusicGenreRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_cf_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface CreateGenreDto {
  name: string;
  description?: string;
  imageCfId?: string;
  sortOrder?: number;
}

interface UpdateGenreDto {
  name?: string;
  description?: string | null;
  imageCfId?: string | null;
  sortOrder?: number;
}

const SELECT = 'id, slug, name, description, image_cf_id, sort_order, created_at, updated_at';

/** All genres + count of clubs using each. Used by the admin Géneros tab. */
export async function listGenresWithUsage(): Promise<
  ActionResult<Array<MusicGenreRow & { club_count: number }>>
> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const svc = getServiceClient();
  const { data: rows, error } = await svc
    .from('music_genres')
    .select(SELECT)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) return { ok: false, error: error.message };
  const ids = (rows ?? []).map((r) => (r as MusicGenreRow).id);
  const { data: clubRows } = ids.length
    ? await svc.from('clubs').select('music_genre_id').in('music_genre_id', ids)
    : { data: [] as Array<{ music_genre_id: string }> };
  const countByGenre = new Map<string, number>();
  for (const r of (clubRows ?? []) as Array<{ music_genre_id: string }>) {
    countByGenre.set(r.music_genre_id, (countByGenre.get(r.music_genre_id) ?? 0) + 1);
  }
  return {
    ok: true,
    data: ((rows ?? []) as MusicGenreRow[]).map((g) => ({
      ...g,
      club_count: countByGenre.get(g.id) ?? 0,
    })),
  };
}

/** Resolve a unique slug for a new genre name by appending -2, -3 on
 *  collision. Genres are few so a 10-attempt loop is plenty. */
async function uniqueGenreSlug(
  svc: ReturnType<typeof getServiceClient>,
  base: string,
): Promise<string> {
  const baseSlug = musicSlug(base);
  let candidate = baseSlug;
  for (let i = 0; i < 10; i += 1) {
    const { data } = await svc.from('music_genres').select('id').eq('slug', candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${baseSlug}-${i + 2}`;
  }
  return `${baseSlug}-${Date.now()}`;
}

export async function createGenre(
  dto: CreateGenreDto,
): Promise<ActionResult<MusicGenreRow>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const svc = getServiceClient();
  const name = dto.name.trim();
  if (name.length < 2) return { ok: false, error: 'Nombre demasiado corto.' };
  const slug = await uniqueGenreSlug(svc, name);
  const { data, error } = await svc
    .from('music_genres')
    .insert({
      slug,
      name,
      description: dto.description?.trim() || null,
      image_cf_id: dto.imageCfId ?? null,
      sort_order: dto.sortOrder ?? 999,
    })
    .select(SELECT)
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'No se pudo crear el género.' };
  revalidatePath('/admin/music');
  revalidatePath('/musica');
  return { ok: true, data: data as MusicGenreRow };
}

export async function updateGenre(
  id: string,
  dto: UpdateGenreDto,
): Promise<ActionResult<MusicGenreRow>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const svc = getServiceClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (dto.name !== undefined) {
    const n = dto.name.trim();
    if (n.length < 2) return { ok: false, error: 'Nombre demasiado corto.' };
    patch.name = n;
  }
  if (dto.description !== undefined) patch.description = dto.description?.trim() || null;
  if (dto.imageCfId !== undefined) patch.image_cf_id = dto.imageCfId;
  if (dto.sortOrder !== undefined) patch.sort_order = dto.sortOrder;
  const { data, error } = await svc
    .from('music_genres')
    .update(patch)
    .eq('id', id)
    .select(SELECT)
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'No se pudo actualizar.' };
  revalidatePath('/admin/music');
  revalidatePath('/musica');
  return { ok: true, data: data as MusicGenreRow };
}

export async function deleteGenre(
  id: string,
): Promise<ActionResult<{ deleted: true }>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const svc = getServiceClient();
  // FK is `on delete restrict`; pre-flight the check so we return a clean
  // message instead of a Postgres error string.
  const { count } = await svc
    .from('clubs')
    .select('id', { count: 'exact', head: true })
    .eq('music_genre_id', id);
  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: `No se puede borrar: ${count} club(es) usan este género. Reasigna o borra esos clubes primero.`,
    };
  }
  const { error } = await svc.from('music_genres').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/music');
  revalidatePath('/musica');
  return { ok: true, data: { deleted: true } };
}
