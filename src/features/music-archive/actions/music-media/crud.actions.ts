'use server';

import { after } from 'next/server';
import { getServiceClient } from '@/utils/supabase/server';
import { deleteImage } from '@/lib/cloudflare/images';
import { deleteStreamVideo } from '@/lib/cloudflare/stream';
import { parseVideoEmbed } from '@/lib/utils/video-embed';
import type {
  CreateMusicMediaInput,
  UpdateMusicMediaInput,
} from '../../types/music-media.types';
import { requireSession, type ActionResult } from '../_shared';
import { isPlatformAdmin, assertClubMembership } from './authorization.helpers';
import { revalidateForItem, revalidateMusicMediaBase } from './revalidate.helpers';

/** Insert a new music media item plus its three pivots. The base row is
 *  inserted by the user's own client so RLS attributes uploaded_by correctly;
 *  the pivots are inserted by the service client because the club pivot rule
 *  requires a self-referencing exists() that's awkward to satisfy mid-insert
 *  and admins should be allowed to attach to any club. */
export async function createMusicMedia(
  input: CreateMusicMediaInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión para subir contenido.' };

  if (input.kind === 'photo' && input.source !== 'cf_image') {
    return { ok: false, error: 'Las fotos requieren un Cloudflare Image id.' };
  }
  if (input.kind === 'video' && input.source === 'cf_image') {
    return { ok: false, error: 'Los videos requieren Cloudflare Stream o un embed.' };
  }

  let embedProvider: 'youtube' | 'vimeo' | null = null;
  let embedUrl: string | null = null;
  if (input.source === 'embed') {
    if (!input.embedUrl) return { ok: false, error: 'Falta la URL del video.' };
    const parsed = parseVideoEmbed(input.embedUrl);
    if (!parsed) return { ok: false, error: 'URL no reconocida. Usa YouTube o Vimeo.' };
    embedProvider = parsed.provider;
    embedUrl = parsed.normalizedUrl;
  }

  if (input.source === 'cf_image' && !input.cfImageId) {
    return { ok: false, error: 'Falta el id de Cloudflare Image.' };
  }
  if (input.source === 'cf_stream' && !input.cfStreamUid) {
    return { ok: false, error: 'Falta el uid de Cloudflare Stream.' };
  }

  const { data: inserted, error } = await session.client
    .from('music_media')
    .insert({
      kind: input.kind,
      source: input.source,
      cf_image_id: input.source === 'cf_image' ? input.cfImageId : null,
      cf_stream_uid: input.source === 'cf_stream' ? input.cfStreamUid : null,
      embed_url: embedUrl,
      embed_provider: embedProvider,
      thumbnail_cf_image_id: input.thumbnailCfImageId ?? null,
      caption: input.caption?.trim() || null,
      duration_seconds: input.durationSeconds ?? null,
      uploaded_by: session.userId,
    })
    .select('id')
    .single();
  if (error || !inserted) {
    return { ok: false, error: error?.message ?? 'No se pudo crear el item.' };
  }
  const mediaId = (inserted as { id: string }).id;

  const service = getServiceClient();
  const artistIds = (input.artistIds ?? []).filter(Boolean);
  const albumIds = (input.albumIds ?? []).filter(Boolean);
  const clubIds = (input.clubIds ?? []).filter(Boolean);

  // Enforce club membership unless the user is a platform admin. Service
  // client bypasses RLS, so we re-check the authorization rule here.
  if (clubIds.length > 0) {
    if (!(await isPlatformAdmin(session.client, session.userId))) {
      const denied = await assertClubMembership(session.client, session.userId, clubIds);
      if (denied) {
        return {
          ok: false,
          error: denied,
        };
      }
    }
  }

  await Promise.all([
    artistIds.length > 0
      ? service
          .from('music_media_artists')
          .insert(artistIds.map((artist_id) => ({ media_id: mediaId, artist_id })))
      : Promise.resolve(null),
    albumIds.length > 0
      ? service
          .from('music_media_albums')
          .insert(albumIds.map((album_id) => ({ media_id: mediaId, album_id })))
      : Promise.resolve(null),
    clubIds.length > 0
      ? service
          .from('music_media_clubs')
          .insert(clubIds.map((club_id) => ({ media_id: mediaId, club_id })))
      : Promise.resolve(null),
  ]);

  revalidateMusicMediaBase();
  return { ok: true, data: { id: mediaId } };
}

/** Replace tag / album / club associations and caption for an existing item.
 *  Only the uploader or a platform admin may call this. */
export async function updateMusicMedia(
  id: string,
  patch: UpdateMusicMediaInput,
): Promise<ActionResult<{ updated: true }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión.' };

  const service = getServiceClient();
  const { data: existing } = await service
    .from('music_media')
    .select('uploaded_by')
    .eq('id', id)
    .maybeSingle();
  if (!existing) return { ok: false, error: 'Item no encontrado.' };
  const ownerId = (existing as { uploaded_by: string | null }).uploaded_by;

  const isAdmin = await isPlatformAdmin(session.client, session.userId);
  if (!isAdmin && ownerId !== session.userId) {
    return { ok: false, error: 'No tienes permisos para editar este item.' };
  }

  if (patch.caption !== undefined) {
    const value = patch.caption?.trim();
    await service
      .from('music_media')
      .update({ caption: value && value.length > 0 ? value : null })
      .eq('id', id);
  }

  // Atomic replace for each pivot the caller passed.
  const ops: Array<Promise<unknown>> = [];
  if (patch.artistIds !== undefined) {
    ops.push(
      (async () => {
        await service.from('music_media_artists').delete().eq('media_id', id);
        if (patch.artistIds && patch.artistIds.length > 0) {
          await service
            .from('music_media_artists')
            .insert(patch.artistIds.map((artist_id) => ({ media_id: id, artist_id })));
        }
      })(),
    );
  }
  if (patch.albumIds !== undefined) {
    ops.push(
      (async () => {
        await service.from('music_media_albums').delete().eq('media_id', id);
        if (patch.albumIds && patch.albumIds.length > 0) {
          await service
            .from('music_media_albums')
            .insert(patch.albumIds.map((album_id) => ({ media_id: id, album_id })));
        }
      })(),
    );
  }
  if (patch.clubIds !== undefined) {
    if (!isAdmin && patch.clubIds.length > 0) {
      const denied = await assertClubMembership(session.client, session.userId, patch.clubIds);
      if (denied) {
        return { ok: false, error: denied };
      }
    }
    ops.push(
      (async () => {
        await service.from('music_media_clubs').delete().eq('media_id', id);
        if (patch.clubIds && patch.clubIds.length > 0) {
          await service
            .from('music_media_clubs')
            .insert(patch.clubIds.map((club_id) => ({ media_id: id, club_id })));
        }
      })(),
    );
  }
  await Promise.all(ops);

  revalidateMusicMediaBase();
  return { ok: true, data: { updated: true } };
}

export async function deleteMusicMedia(
  id: string,
): Promise<ActionResult<{ deleted: true }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Inicia sesión.' };

  const service = getServiceClient();
  const { data: existing } = await service
    .from('music_media')
    .select('id, uploaded_by, source, cf_image_id, cf_stream_uid, thumbnail_cf_image_id')
    .eq('id', id)
    .maybeSingle();
  if (!existing) return { ok: false, error: 'Item no encontrado.' };
  const row = existing as {
    id: string;
    uploaded_by: string | null;
    source: 'cf_image' | 'cf_stream' | 'embed';
    cf_image_id: string | null;
    cf_stream_uid: string | null;
    thumbnail_cf_image_id: string | null;
  };

  const isAdmin = await isPlatformAdmin(session.client, session.userId);
  if (!isAdmin && row.uploaded_by !== session.userId) {
    return { ok: false, error: 'No tienes permisos para borrar este item.' };
  }

  // Capture associated slugs *before* the row goes away so we can revalidate
  // every page that surfaced it.
  const [{ data: artistPivots }, { data: albumPivots }, { data: clubPivots }] = await Promise.all([
    service.from('music_media_artists').select('artist_id').eq('media_id', id),
    service.from('music_media_albums').select('album_id').eq('media_id', id),
    service.from('music_media_clubs').select('club_id').eq('media_id', id),
  ]);
  const artistIds = ((artistPivots ?? []) as Array<{ artist_id: string }>).map((r) => r.artist_id);
  const albumIds = ((albumPivots ?? []) as Array<{ album_id: string }>).map((r) => r.album_id);
  const clubIds = ((clubPivots ?? []) as Array<{ club_id: string }>).map((r) => r.club_id);

  const [artistRes, albumRes, clubRes] = await Promise.all([
    artistIds.length > 0
      ? service.from('music_artists').select('slug').in('id', artistIds)
      : Promise.resolve({ data: [] as Array<{ slug: string }> }),
    albumIds.length > 0
      ? service.from('music_albums').select('slug').in('id', albumIds)
      : Promise.resolve({ data: [] as Array<{ slug: string }> }),
    clubIds.length > 0
      ? service.from('clubs').select('slug').in('id', clubIds)
      : Promise.resolve({ data: [] as Array<{ slug: string }> }),
  ]);

  const { error } = await service.from('music_media').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  after(async () => {
    const tasks: Array<Promise<unknown>> = [];
    if (row.source === 'cf_image' && row.cf_image_id) tasks.push(deleteImage(row.cf_image_id));
    if (row.source === 'cf_stream' && row.cf_stream_uid)
      tasks.push(deleteStreamVideo(row.cf_stream_uid));
    if (row.thumbnail_cf_image_id) tasks.push(deleteImage(row.thumbnail_cf_image_id));
    await Promise.allSettled(tasks);
  });

  revalidateForItem({
    artists: (artistRes.data ?? []) as Array<{ slug: string }>,
    albums: (albumRes.data ?? []) as Array<{ slug: string }>,
    clubs: (clubRes.data ?? []) as Array<{ slug: string }>,
  });
  return { ok: true, data: { deleted: true } };
}
