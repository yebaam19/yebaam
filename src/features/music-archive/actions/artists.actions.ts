'use server';

import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServiceClient } from '@/utils/supabase/server';
import { deleteAudio } from '@/lib/cloudflare/r2';
import { deleteImage } from '@/lib/cloudflare/images';
import type {
  CreateArtistDto,
  MusicArtistRow,
  UpdateArtistDto,
} from '../types/music.types';
import {
  adminGate,
  requireSession,
  revalidateMusic,
  uniqueSlug,
  type ActionResult,
} from './_shared';

export async function createArtist(
  dto: CreateArtistDto,
): Promise<ActionResult<MusicArtistRow>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const name = dto.name.trim();
  if (!name) return { ok: false, error: 'El nombre del artista es obligatorio.' };

  const slug = await uniqueSlug(session.client, 'music_artists', name);

  const { data, error } = await session.client
    .from('music_artists')
    .insert({
      name,
      slug,
      country: dto.country?.trim() || null,
      born_year: dto.bornYear ?? null,
      died_year: dto.diedYear ?? null,
      bio_short: dto.bioShort?.trim() || null,
      photo_cf_image_id: dto.photoCfImageId ?? null,
      contributed_by: session.userId,
    })
    .select('*')
    .single();
  if (error) return { ok: false, error: error.message };
  revalidateMusic({ artistSlug: slug });
  return { ok: true, data: data as MusicArtistRow };
}

/** Look up an artist by case-insensitive exact name; create if absent.
 *  Used by upload forms to avoid duplicate-artist rows when multiple
 *  collectors upload the same person's albums independently. */
export async function findOrCreateArtistAction(
  dto: CreateArtistDto,
): Promise<ActionResult<MusicArtistRow>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const name = dto.name.trim();
  if (!name) return { ok: false, error: 'El nombre del artista es obligatorio.' };

  const { data: existing } = await session.client
    .from('music_artists')
    .select('*')
    .ilike('name', name)
    .limit(1)
    .maybeSingle();
  if (existing) return { ok: true, data: existing as MusicArtistRow };

  return createArtist(dto);
}

export async function updateArtist(
  id: string,
  dto: UpdateArtistDto,
): Promise<ActionResult<MusicArtistRow>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (dto.name !== undefined) patch.name = dto.name.trim();
  if (dto.country !== undefined) patch.country = dto.country?.trim() || null;
  if (dto.bornYear !== undefined) patch.born_year = dto.bornYear;
  if (dto.diedYear !== undefined) patch.died_year = dto.diedYear;
  if (dto.bioShort !== undefined) patch.bio_short = dto.bioShort?.trim() || null;
  if (dto.photoCfImageId !== undefined) patch.photo_cf_image_id = dto.photoCfImageId;
  const { data, error } = await service
    .from('music_artists')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return { ok: false, error: error.message };
  const row = data as MusicArtistRow;
  revalidateMusic({ artistSlug: row.slug });
  return { ok: true, data: row };
}

export async function deleteArtist(id: string): Promise<ActionResult<{ deleted: true }>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();

  // Collect every R2 key + image id that will be orphaned by the cascade.
  const { data: artist } = await service
    .from('music_artists')
    .select('photo_cf_image_id')
    .eq('id', id)
    .maybeSingle();
  const { data: albums } = await service
    .from('music_albums')
    .select('cover_cf_image_id, back_cover_cf_image_id, label_cf_image_id, id')
    .eq('artist_id', id);
  const albumIds = (albums ?? []).map((a) => (a as { id: string }).id);
  const imageIds: string[] = [];
  const a = artist as { photo_cf_image_id: string | null } | null;
  if (a?.photo_cf_image_id) imageIds.push(a.photo_cf_image_id);
  for (const alb of albums ?? []) {
    const r = alb as {
      cover_cf_image_id: string | null;
      back_cover_cf_image_id: string | null;
      label_cf_image_id: string | null;
    };
    if (r.cover_cf_image_id) imageIds.push(r.cover_cf_image_id);
    if (r.back_cover_cf_image_id) imageIds.push(r.back_cover_cf_image_id);
    if (r.label_cf_image_id) imageIds.push(r.label_cf_image_id);
  }
  let r2Keys: string[] = [];
  if (albumIds.length > 0) {
    const { data: tracks } = await service
      .from('music_tracks')
      .select('r2_key')
      .in('album_id', albumIds);
    r2Keys = (tracks ?? []).map((t) => (t as { r2_key: string }).r2_key);
  }

  const { error } = await service.from('music_artists').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  // Best-effort media cleanup. CDN orphans are recoverable later; DB integrity
  // is what matters in the response, so we don't fail the action on these.
  after(async () => {
    await Promise.allSettled([
      ...imageIds.map((iid) => deleteImage(iid)),
      ...r2Keys.map((key) => deleteAudio(key)),
    ]);
  });

  revalidatePath('/musica');
  return { ok: true, data: { deleted: true } };
}

export async function listAdminArtists(q?: string): Promise<
  ActionResult<
    Array<{
      id: string;
      name: string;
      slug: string;
      country: string | null;
      born_year: number | null;
      died_year: number | null;
      bio_short: string | null;
      photo_cf_image_id: string | null;
      album_count: number;
    }>
  >
> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();
  let query = service
    .from('music_artists')
    .select('id, name, slug, country, born_year, died_year, bio_short, photo_cf_image_id')
    .order('created_at', { ascending: false })
    .limit(200);
  const trimmed = q?.trim();
  if (trimmed) query = query.ilike('name', `%${trimmed}%`);
  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };
  const rows = (data ?? []) as Array<{
    id: string;
    name: string;
    slug: string;
    country: string | null;
    born_year: number | null;
    died_year: number | null;
    bio_short: string | null;
    photo_cf_image_id: string | null;
  }>;

  const artistIds = rows.map((r) => r.id);
  const counts = new Map<string, number>();
  if (artistIds.length > 0) {
    const { data: albs } = await service
      .from('music_albums')
      .select('artist_id')
      .in('artist_id', artistIds);
    for (const a of (albs ?? []) as Array<{ artist_id: string }>) {
      counts.set(a.artist_id, (counts.get(a.artist_id) ?? 0) + 1);
    }
  }

  return { ok: true, data: rows.map((r) => ({ ...r, album_count: counts.get(r.id) ?? 0 })) };
}
