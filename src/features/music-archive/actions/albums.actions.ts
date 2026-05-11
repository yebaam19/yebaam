'use server';

import { after } from 'next/server';
import { getServiceClient } from '@/utils/supabase/server';
import { deleteAudio } from '@/lib/cloudflare/r2';
import { deleteImage } from '@/lib/cloudflare/images';
import type {
  CreateAlbumDto,
  MusicAlbumRow,
  MusicArtistRow,
  MusicLabelRow,
  MusicTrackRow,
  UpdateAlbumDto,
} from '../types/music.types';
import {
  adminGate,
  requireSession,
  revalidateMusic,
  uniqueSlug,
  type ActionResult,
} from './_shared';

export async function createAlbum(
  dto: CreateAlbumDto,
): Promise<ActionResult<MusicAlbumRow>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const title = dto.title.trim();
  if (!title) return { ok: false, error: 'El título es obligatorio.' };

  const slug = await uniqueSlug(session.client, 'music_albums', `${title}-${dto.year ?? ''}`);

  const { data, error } = await session.client
    .from('music_albums')
    .insert({
      artist_id: dto.artistId,
      label_id: dto.labelId ?? null,
      title,
      slug,
      year: dto.year ?? null,
      country: dto.country?.trim() || null,
      format: dto.format,
      cover_cf_image_id: dto.coverCfImageId ?? null,
      back_cover_cf_image_id: dto.backCoverCfImageId ?? null,
      label_cf_image_id: dto.labelCfImageId ?? null,
      catalog_number: dto.catalogNumber?.trim() || null,
      notes: dto.notes?.trim() || null,
      condition: dto.condition ?? null,
      for_trade: dto.forTrade ?? false,
      contributed_by: session.userId,
    })
    .select('*')
    .single();
  if (error) return { ok: false, error: error.message };
  revalidateMusic({ albumSlug: slug });
  return { ok: true, data: data as MusicAlbumRow };
}

export async function updateAlbum(
  id: string,
  dto: UpdateAlbumDto,
): Promise<ActionResult<MusicAlbumRow>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();
  const patch: Record<string, unknown> = {};
  if (dto.title !== undefined) patch.title = dto.title.trim();
  if (dto.year !== undefined) patch.year = dto.year;
  if (dto.country !== undefined)
    patch.country = dto.country?.trim().toUpperCase().slice(0, 2) || null;
  if (dto.format !== undefined) patch.format = dto.format;
  if (dto.artistId !== undefined) patch.artist_id = dto.artistId;
  if (dto.labelId !== undefined) patch.label_id = dto.labelId;
  if (dto.coverCfImageId !== undefined) patch.cover_cf_image_id = dto.coverCfImageId;
  if (dto.backCoverCfImageId !== undefined) patch.back_cover_cf_image_id = dto.backCoverCfImageId;
  if (dto.labelCfImageId !== undefined) patch.label_cf_image_id = dto.labelCfImageId;
  if (dto.catalogNumber !== undefined) patch.catalog_number = dto.catalogNumber?.trim() || null;
  if (dto.notes !== undefined) patch.notes = dto.notes?.trim() || null;
  if (dto.condition !== undefined) patch.condition = dto.condition;
  if (dto.forTrade !== undefined) patch.for_trade = dto.forTrade;
  const { data, error } = await service
    .from('music_albums')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return { ok: false, error: error.message };
  const row = data as MusicAlbumRow;
  revalidateMusic({ albumSlug: row.slug });
  return { ok: true, data: row };
}

export async function deleteAlbum(id: string): Promise<ActionResult<{ deleted: true }>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();

  const { data: album } = await service
    .from('music_albums')
    .select('cover_cf_image_id, back_cover_cf_image_id, label_cf_image_id, slug')
    .eq('id', id)
    .maybeSingle();
  const { data: tracks } = await service
    .from('music_tracks')
    .select('r2_key')
    .eq('album_id', id);

  const imageIds: string[] = [];
  const a = album as {
    cover_cf_image_id: string | null;
    back_cover_cf_image_id: string | null;
    label_cf_image_id: string | null;
    slug: string;
  } | null;
  if (a?.cover_cf_image_id) imageIds.push(a.cover_cf_image_id);
  if (a?.back_cover_cf_image_id) imageIds.push(a.back_cover_cf_image_id);
  if (a?.label_cf_image_id) imageIds.push(a.label_cf_image_id);
  const r2Keys = (tracks ?? []).map((t) => (t as { r2_key: string }).r2_key);

  const { error } = await service.from('music_albums').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  after(async () => {
    await Promise.allSettled([
      ...imageIds.map((iid) => deleteImage(iid)),
      ...r2Keys.map((key) => deleteAudio(key)),
    ]);
  });

  if (a?.slug) revalidateMusic({ albumSlug: a.slug });
  return { ok: true, data: { deleted: true } };
}

export async function listAdminAlbums(q?: string): Promise<
  ActionResult<
    Array<{
      id: string;
      title: string;
      slug: string;
      year: number | null;
      country: string | null;
      format: string;
      cover_cf_image_id: string | null;
      catalog_number: string | null;
      condition: string | null;
      for_trade: boolean;
      artist_id: string;
      artist_name: string;
      track_count: number;
    }>
  >
> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();
  let query = service
    .from('music_albums')
    .select(
      'id, title, slug, year, country, format, cover_cf_image_id, catalog_number, condition, for_trade, artist_id, music_artists!inner(name)',
    )
    .order('created_at', { ascending: false })
    .limit(200);
  const trimmed = q?.trim();
  if (trimmed) query = query.ilike('title', `%${trimmed}%`);
  const { data, error } = await query;
  if (error) return { ok: false, error: error.message };

  type Row = {
    id: string;
    title: string;
    slug: string;
    year: number | null;
    country: string | null;
    format: string;
    cover_cf_image_id: string | null;
    catalog_number: string | null;
    condition: string | null;
    for_trade: boolean;
    artist_id: string;
    music_artists: { name: string } | { name: string }[];
  };
  const rows = (data ?? []) as unknown as Row[];

  // Track counts in one round-trip rather than N+1.
  const albumIds = rows.map((r) => r.id);
  const countsByAlbum = new Map<string, number>();
  if (albumIds.length > 0) {
    const { data: trackRows } = await service
      .from('music_tracks')
      .select('album_id')
      .in('album_id', albumIds);
    for (const t of (trackRows ?? []) as Array<{ album_id: string }>) {
      countsByAlbum.set(t.album_id, (countsByAlbum.get(t.album_id) ?? 0) + 1);
    }
  }

  return {
    ok: true,
    data: rows.map((r) => {
      const artist = Array.isArray(r.music_artists) ? r.music_artists[0] : r.music_artists;
      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        year: r.year,
        country: r.country,
        format: r.format,
        cover_cf_image_id: r.cover_cf_image_id,
        catalog_number: r.catalog_number,
        condition: r.condition,
        for_trade: Boolean(r.for_trade),
        artist_id: r.artist_id,
        artist_name: artist?.name ?? 'Desconocido',
        track_count: countsByAlbum.get(r.id) ?? 0,
      };
    }),
  };
}

/** Flip `for_trade` on many albums at once. Platform-admin only. Useful for
 *  curating the "available for trade" pool during a swap meet event. */
export async function bulkToggleForTrade(
  albumIds: string[],
  forTrade: boolean,
): Promise<ActionResult<{ count: number }>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  if (albumIds.length === 0) return { ok: true, data: { count: 0 } };
  const service = getServiceClient();
  const { data, error } = await service
    .from('music_albums')
    .update({ for_trade: forTrade })
    .in('id', albumIds)
    .select('slug');
  if (error) return { ok: false, error: error.message };
  // Revalidate every affected detail page + the music landing.
  revalidateMusic();
  for (const r of (data ?? []) as Array<{ slug: string }>) {
    revalidateMusic({ albumSlug: r.slug });
  }
  return { ok: true, data: { count: (data ?? []).length } };
}

/** Full album detail for the admin editor — includes tracks + artist + label
 *  so the modal renders without an extra round-trip. */
export async function getAlbumForAdminEdit(id: string): Promise<
  ActionResult<{
    album: MusicAlbumRow;
    artist: MusicArtistRow;
    label: MusicLabelRow | null;
    tracks: MusicTrackRow[];
  }>
> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();
  const { data: album, error } = await service
    .from('music_albums')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !album) return { ok: false, error: error?.message ?? 'Álbum no encontrado.' };
  const a = album as MusicAlbumRow;
  const [{ data: artist }, { data: label }, { data: tracks }] = await Promise.all([
    service.from('music_artists').select('*').eq('id', a.artist_id).maybeSingle(),
    a.label_id
      ? service.from('music_labels').select('*').eq('id', a.label_id).maybeSingle()
      : Promise.resolve({ data: null }),
    service
      .from('music_tracks')
      .select('*')
      .eq('album_id', a.id)
      .order('side', { ascending: true, nullsFirst: true })
      .order('position', { ascending: true }),
  ]);
  return {
    ok: true,
    data: {
      album: a,
      artist: artist as MusicArtistRow,
      label: (label as MusicLabelRow | null) ?? null,
      tracks: (tracks as MusicTrackRow[] | null) ?? [],
    },
  };
}
