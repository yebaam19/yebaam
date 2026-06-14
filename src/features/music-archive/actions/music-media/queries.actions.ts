'use server';

import { getServiceClient } from '@/utils/supabase/server';
import type { MusicMediaItem } from '../../types/music-media.types';
import { requireSession, type ActionResult } from '../_shared';
import { isPlatformAdmin } from './authorization.helpers';
import {
  assembleAdminMediaItems,
  type RawAdminMediaRow,
} from './admin-media.helpers';

/** Lightweight search over albums by title, used by the uploader form. */
export async function searchAlbumsForTag(
  query: string,
): Promise<ActionResult<Array<{ id: string; title: string; slug: string }>>> {
  const q = query.trim();
  if (q.length < 2) return { ok: true, data: [] };
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión.' };
  const { data, error } = await session.client
    .from('music_albums')
    .select('id, title, slug')
    .ilike('title', `%${q}%`)
    .order('title', { ascending: true })
    .limit(20);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as Array<{ id: string; title: string; slug: string }> };
}

/** List the music clubs the caller belongs to (plus all clubs if admin). The
 *  uploader uses this to populate the club selector. */
export async function listClubsForCurrentUser(): Promise<
  ActionResult<Array<{ id: string; name: string; slug: string }>>
> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión.' };
  if (await isPlatformAdmin(session.client, session.userId)) {
    const { data } = await session.client
      .from('clubs')
      .select('id, name, slug')
      .eq('category', 'MUSICA')
      .not('music_genre_id', 'is', null)
      .order('name', { ascending: true });
    return { ok: true, data: (data ?? []) as Array<{ id: string; name: string; slug: string }> };
  }
  const { data: cm } = await session.client
    .from('club_members')
    .select('club_id')
    .eq('user_id', session.userId);
  const clubIds = ((cm ?? []) as Array<{ club_id: string }>).map((r) => r.club_id);
  if (clubIds.length === 0) return { ok: true, data: [] };
  const { data } = await session.client
    .from('clubs')
    .select('id, name, slug')
    .in('id', clubIds)
    .eq('category', 'MUSICA')
    .not('music_genre_id', 'is', null)
    .order('name', { ascending: true });
  return { ok: true, data: (data ?? []) as Array<{ id: string; name: string; slug: string }> };
}

/** Admin-only feed used by the AdminMusicMediaList tab. */
export async function listAdminMusicMedia(
  limit = 200,
): Promise<ActionResult<MusicMediaItem[]>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión.' };
  if (!(await isPlatformAdmin(session.client, session.userId))) {
    return { ok: false, error: 'Solo administradores.' };
  }

  const service = getServiceClient();
  const { data: rows, error } = await service
    .from('music_media')
    .select(
      'id, kind, source, cf_image_id, cf_stream_uid, embed_url, embed_provider, thumbnail_cf_image_id, caption, duration_seconds, uploaded_by, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !rows) return { ok: false, error: error?.message ?? 'No se pudo listar.' };

  const mediaIds = (rows as Array<{ id: string }>).map((r) => r.id);
  if (mediaIds.length === 0) return { ok: true, data: [] };

  const [artistPivots, albumPivots, clubPivots] = await Promise.all([
    service.from('music_media_artists').select('media_id, artist_id').in('media_id', mediaIds),
    service.from('music_media_albums').select('media_id, album_id').in('media_id', mediaIds),
    service.from('music_media_clubs').select('media_id, club_id').in('media_id', mediaIds),
  ]);
  const aRows = (artistPivots.data ?? []) as Array<{ media_id: string; artist_id: string }>;
  const bRows = (albumPivots.data ?? []) as Array<{ media_id: string; album_id: string }>;
  const cRows = (clubPivots.data ?? []) as Array<{ media_id: string; club_id: string }>;

  const aIds = Array.from(new Set(aRows.map((r) => r.artist_id)));
  const bIds = Array.from(new Set(bRows.map((r) => r.album_id)));
  const cIds = Array.from(new Set(cRows.map((r) => r.club_id)));
  const [aRes, bRes, cRes] = await Promise.all([
    aIds.length > 0
      ? service.from('music_artists').select('id, name, slug').in('id', aIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string; slug: string }> }),
    bIds.length > 0
      ? service.from('music_albums').select('id, title, slug').in('id', bIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string; slug: string }> }),
    cIds.length > 0
      ? service.from('clubs').select('id, name, slug').in('id', cIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string; slug: string }> }),
  ]);

  return {
    ok: true,
    data: assembleAdminMediaItems(rows as RawAdminMediaRow[], {
      aRows,
      bRows,
      cRows,
      aRes: (aRes.data ?? []) as Array<{ id: string; name: string; slug: string }>,
      bRes: (bRes.data ?? []) as Array<{ id: string; title: string; slug: string }>,
      cRes: (cRes.data ?? []) as Array<{ id: string; name: string; slug: string }>,
    }),
  };
}
