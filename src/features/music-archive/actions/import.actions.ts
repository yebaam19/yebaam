'use server';

import { getServiceClient } from '@/utils/supabase/server';
import { uploadAudioFromUrl } from '@/lib/cloudflare/r2';
import { uploadImageFromUrl } from '@/lib/cloudflare/images';
import {
  detectSource,
  extractMusicFromUrl,
  isAllowedAudioHost,
  type DetectedAlbum,
} from '../server/music.importer';
import { requirePlatformAdmin } from '../server/music.server';
import type {
  ExtractedImportPreview,
  MusicImportSource,
} from '../types/music.types';
import {
  fireTrackAuditAfter,
  musicSlug,
  revalidateMusic,
  type ActionResult,
} from './_shared';

// NOTE: 'use server' files cannot export TS interfaces — they live in
// types/music.types.ts (ExtractedImportPreview, DetectedAlbumPreview, ...).

export async function extractFromUrl(
  url: string,
): Promise<ActionResult<ExtractedImportPreview>> {
  const admin = await requirePlatformAdmin();
  if (!admin) return { ok: false, error: 'Solo administradores pueden importar.' };

  try {
    new URL(url);
  } catch {
    return { ok: false, error: 'URL inválida.' };
  }

  // Skip if this URL was already imported.
  const service = getServiceClient();
  const { data: existing } = await service
    .from('music_imports')
    .select('id, status')
    .eq('source_url', url)
    .eq('status', 'imported')
    .maybeSingle();
  if (existing) {
    return {
      ok: false,
      error: 'Esta URL ya fue importada anteriormente. Mira la lista de imports debajo.',
    };
  }

  let result: Awaited<ReturnType<typeof extractMusicFromUrl>>;
  try {
    result = await extractMusicFromUrl(url);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    // Record failure too, for audit.
    await service.from('music_imports').insert({
      source: detectSource(url),
      source_url: url,
      status: 'failed',
      error_detail: detail,
      imported_by: admin.userId,
    });
    return { ok: false, error: detail };
  }

  // Persist the preview as a `pending` row so confirm doesn't re-call Firecrawl.
  const { data: row, error } = await service
    .from('music_imports')
    .insert({
      source: result.source,
      source_url: url,
      status: 'pending',
      detected_metadata: result.detected,
      imported_by: admin.userId,
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    data: {
      importId: (row as { id: string }).id,
      source: result.source,
      source_url: url,
      detected: result.detected,
    },
  };
}

export async function confirmImport(
  importId: string,
  edits: Partial<DetectedAlbum>,
): Promise<ActionResult<{ albumId: string; albumSlug: string; trackIds: string[] }>> {
  const admin = await requirePlatformAdmin();
  if (!admin) return { ok: false, error: 'Solo administradores pueden importar.' };

  const service = getServiceClient();
  const { data: importRow, error: importErr } = await service
    .from('music_imports')
    .select('*')
    .eq('id', importId)
    .maybeSingle();
  if (importErr || !importRow) return { ok: false, error: 'Import no encontrado.' };
  const row = importRow as {
    id: string;
    source: MusicImportSource;
    source_url: string;
    status: string;
    detected_metadata: DetectedAlbum;
  };
  if (row.status === 'imported') {
    return { ok: false, error: 'Este import ya está completado.' };
  }

  const merged: DetectedAlbum = { ...row.detected_metadata, ...edits };
  if (!merged.artist_name?.trim() || !merged.album_title?.trim() || merged.tracks.length === 0) {
    return { ok: false, error: 'Datos incompletos: faltan artista, título o tracks.' };
  }

  // Mark processing.
  await service.from('music_imports').update({ status: 'processing' }).eq('id', importId);

  try {
    // 1) Cover image → Cloudflare Images (server-to-server fetch).
    let coverCfImageId: string | null = null;
    if (merged.cover_image_url) {
      try {
        const cover = await uploadImageFromUrl(merged.cover_image_url, {
          source: row.source,
          source_url: row.source_url,
        });
        coverCfImageId = cover.id;
      } catch (err) {
        console.warn('[confirmImport] cover upload failed (continuing):', err);
      }
    }

    // 2) Artist — find by name, create if missing. Slug is unique so we
    // tolerate the race (next() throws on conflict, we catch and re-fetch).
    const artistSlugBase = musicSlug(merged.artist_name);
    let artistId: string;
    {
      const { data: existing } = await service
        .from('music_artists')
        .select('id')
        .eq('slug', artistSlugBase)
        .maybeSingle();
      if (existing) {
        artistId = (existing as { id: string }).id;
      } else {
        const { data: newArtist, error: artErr } = await service
          .from('music_artists')
          .insert({
            name: merged.artist_name.trim(),
            slug: artistSlugBase,
            country: merged.country?.toUpperCase().slice(0, 2) || null,
            contributed_by: null, // system import
          })
          .select('id')
          .single();
        if (artErr) throw artErr;
        artistId = (newArtist as { id: string }).id;
      }
    }

    // 3) Album — slugify with year+catalog suffix to avoid clashes.
    const albumSlugCandidates = [
      musicSlug(`${merged.album_title}-${merged.year ?? ''}`),
      musicSlug(`${merged.album_title}-${merged.year ?? ''}-${merged.catalog_number ?? ''}`),
      musicSlug(`${merged.album_title}-${importId.slice(0, 8)}`),
    ];
    let albumId: string | null = null;
    let albumSlug: string | null = null;
    for (const slug of albumSlugCandidates) {
      const { data: clash } = await service
        .from('music_albums')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (!clash) {
        const { data: alb, error: albErr } = await service
          .from('music_albums')
          .insert({
            artist_id: artistId,
            title: merged.album_title.trim(),
            slug,
            year: merged.year ?? null,
            country: merged.country?.toUpperCase().slice(0, 2) || null,
            format: merged.format ?? '78rpm',
            cover_cf_image_id: coverCfImageId,
            catalog_number: merged.catalog_number ?? null,
            notes: merged.notes ?? null,
            contributed_by: null,
          })
          .select('id, slug')
          .single();
        if (albErr) throw albErr;
        albumId = (alb as { id: string }).id;
        albumSlug = (alb as { slug: string }).slug;
        break;
      }
    }
    if (!albumId || !albumSlug) {
      throw new Error('No se pudo crear el álbum (slug en conflicto).');
    }

    // 4) Tracks — stream each remote MP3 to R2, then create the row.
    const trackIds: string[] = [];
    const r2KeysByTrackId: string[] = [];
    const importedAt = new Date().toISOString().slice(0, 10);
    const note = `Importado desde ${row.source_url} el ${importedAt}`;
    const yearForKey = merged.year ?? new Date().getUTCFullYear();
    let position = 1;
    for (const t of merged.tracks) {
      if (!isAllowedAudioHost(t.audio_url)) {
        console.warn('[confirmImport] skipping disallowed audio host:', t.audio_url);
        continue;
      }
      const fmt = t.format ?? 'mp3';
      const r2Key = `tracks/${yearForKey}/${crypto.randomUUID()}.${fmt}`;
      const contentType =
        fmt === 'flac'
          ? 'audio/flac'
          : fmt === 'wav'
            ? 'audio/wav'
            : fmt === 'ogg'
              ? 'audio/ogg'
              : 'audio/mpeg';
      try {
        await uploadAudioFromUrl(t.audio_url, r2Key, contentType);
      } catch (err) {
        console.error('[confirmImport] track upload failed:', t.audio_url, err);
        continue;
      }
      const { data: trackRow, error: trErr } = await service
        .from('music_tracks')
        .insert({
          album_id: albumId,
          position: t.position ?? position,
          title: t.title.trim(),
          duration_seconds: t.duration_seconds ?? null,
          r2_key: r2Key,
          format: fmt,
          source_media: '78rpm',
          copyright_status: 'public_domain',
          contributor_attestation: true,
          contributed_by: null,
          restored_by_note: note,
        })
        .select('id')
        .single();
      if (trErr) {
        console.error('[confirmImport] track row insert failed:', trErr);
        continue;
      }
      trackIds.push((trackRow as { id: string }).id);
      r2KeysByTrackId.push(r2Key);
      position += 1;
    }

    if (trackIds.length === 0) {
      throw new Error('No se pudo importar ninguna canción. Verifica las URLs de audio.');
    }

    await service
      .from('music_imports')
      .update({
        status: 'imported',
        created_album_id: albumId,
        created_track_ids: trackIds,
        completed_at: new Date().toISOString(),
      })
      .eq('id', importId);

    fireTrackAuditAfter(
      trackIds.map((id, idx) => ({
        trackId: id,
        r2Key: r2KeysByTrackId[idx]!,
        contributorId: null,
      })),
    );

    revalidateMusic({ albumSlug });
    return { ok: true, data: { albumId, albumSlug, trackIds } };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    await service
      .from('music_imports')
      .update({ status: 'failed', error_detail: detail })
      .eq('id', importId);
    return { ok: false, error: detail };
  }
}

export async function listRecentImports(limit = 50): Promise<
  ActionResult<
    Array<{
      id: string;
      source: MusicImportSource;
      source_url: string;
      status: string;
      created_album_id: string | null;
      error_detail: string | null;
      created_at: string;
    }>
  >
> {
  const admin = await requirePlatformAdmin();
  if (!admin) return { ok: false, error: 'Solo administradores.' };
  const service = getServiceClient();
  const { data, error } = await service
    .from('music_imports')
    .select('id, source, source_url, status, created_album_id, error_detail, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as never };
}
