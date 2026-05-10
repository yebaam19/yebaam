'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import { headAudio, getPublicAudioUrl, uploadAudioFromUrl } from '@/lib/cloudflare/r2';
import { uploadImageFromUrl } from '@/lib/cloudflare/images';
import {
  extractMusicFromUrl,
  detectSource,
  isAllowedAudioHost,
  type DetectedAlbum,
} from '../server/music.importer';
import { requirePlatformAdmin } from '../server/music.server';
import type { ExtractedImportPreview, MusicImportSource } from '../types/music.types';
import type {
  AddTrackCreditDto,
  CreateAlbumDto,
  CreateArtistDto,
  CreateLabelDto,
  CreateTrackDto,
  CreateTrackBatchItem,
  MusicAlbumRow,
  MusicArtistRow,
  MusicLabelRow,
  MusicTrackRow,
} from '../types/music.types';

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

type Session = { userId: string; client: SupabaseClient };

async function requireSession(): Promise<Session | null> {
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  if (!data.user) return null;
  return { userId: data.user.id, client };
}

function musicSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'item'
  );
}

async function uniqueSlug(
  client: SupabaseClient,
  table: 'music_artists' | 'music_albums' | 'music_labels',
  base: string,
): Promise<string> {
  const baseSlug = musicSlug(base);
  let candidate = baseSlug;
  let suffix = 1;
  // Up to 20 attempts. Race condition ok — UNIQUE constraint will catch collision.
  for (let i = 0; i < 20; i++) {
    const { data } = await client.from(table).select('id').eq('slug', candidate).maybeSingle();
    if (!data) return candidate;
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
  return `${baseSlug}-${Date.now()}`;
}

function revalidateMusic(slug?: { albumSlug?: string; artistSlug?: string }) {
  revalidatePath('/musica');
  if (slug?.albumSlug) revalidatePath(`/musica/albumes/${slug.albumSlug}`);
  if (slug?.artistSlug) revalidatePath(`/musica/artistas/${slug.artistSlug}`);
}

/** Fire the `notify-music-track-upload` Deno edge function for each newly
 *  inserted track. Best-effort — never blocks the response. Call inside a
 *  Server Action; the `after()` runtime keeps Vercel's runtime alive past
 *  the response. Used by createTrack, createTracksBatch, and confirmImport. */
function fireTrackAuditAfter(
  targets: Array<{ trackId: string; r2Key: string; contributorId: string | null }>,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const internalSecret = process.env.EMAIL_WEBHOOK_SECRET;
  if (!supabaseUrl || !internalSecret || targets.length === 0) return;
  after(async () => {
    for (const t of targets) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/notify-music-track-upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Secret': internalSecret,
          },
          body: JSON.stringify(t),
        });
      } catch (err) {
        console.error('[track-audit] notify-music-track-upload failed:', err);
      }
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Artists

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

// ─────────────────────────────────────────────────────────────────────────────
// Labels

export async function createLabel(
  dto: CreateLabelDto,
): Promise<ActionResult<MusicLabelRow>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const name = dto.name.trim();
  if (!name) return { ok: false, error: 'El nombre del sello es obligatorio.' };

  const slug = await uniqueSlug(session.client, 'music_labels', name);

  const { data, error } = await session.client
    .from('music_labels')
    .insert({
      name,
      slug,
      country: dto.country?.trim() || null,
      founded: dto.founded ?? null,
    })
    .select('*')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as MusicLabelRow };
}

// ─────────────────────────────────────────────────────────────────────────────
// Albums

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
      contributed_by: session.userId,
    })
    .select('*')
    .single();
  if (error) return { ok: false, error: error.message };
  revalidateMusic({ albumSlug: slug });
  return { ok: true, data: data as MusicAlbumRow };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tracks

export async function createTrack(
  dto: CreateTrackDto,
): Promise<ActionResult<MusicTrackRow>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  if (!dto.contributorAttestation) {
    return {
      ok: false,
      error: 'Debes confirmar que tienes derechos sobre esta grabación o que es de dominio público.',
    };
  }
  const title = dto.title.trim();
  if (!title) return { ok: false, error: 'El título es obligatorio.' };

  // Defense in depth: verify the R2 object exists and matches expectations
  // before persisting the row. Stops attackers from claiming arbitrary keys.
  const head = await headAudio(dto.r2Key);
  if (!head.exists) {
    return {
      ok: false,
      error: 'El audio no se encontró en el almacenamiento. Vuelve a subir el archivo.',
    };
  }
  const MAX_AUDIO_BYTES = 200 * 1024 * 1024; // 200 MB ceiling
  if (head.sizeBytes > MAX_AUDIO_BYTES) {
    return { ok: false, error: 'El archivo supera el tamaño máximo permitido (200 MB).' };
  }

  const { data, error } = await session.client
    .from('music_tracks')
    .insert({
      album_id: dto.albumId,
      position: dto.position,
      side: dto.side ?? null,
      title,
      duration_seconds: dto.durationSeconds ?? null,
      r2_key: dto.r2Key,
      format: dto.format,
      bitrate_kbps: dto.bitrateKbps ?? null,
      source_media: dto.sourceMedia ?? null,
      copyright_status: dto.copyrightStatus,
      contributor_attestation: true,
      contributed_by: session.userId,
      restored_by_note: dto.restoredByNote?.trim() || null,
    })
    .select('*')
    .single();
  if (error) return { ok: false, error: error.message };
  const track = data as MusicTrackRow;

  fireTrackAuditAfter([
    { trackId: track.id, r2Key: track.r2_key, contributorId: session.userId },
  ]);

  // Look up the album slug to revalidate that page.
  const { data: album } = await session.client
    .from('music_albums')
    .select('slug, artist_id')
    .eq('id', dto.albumId)
    .maybeSingle();
  if (album) {
    const { data: artist } = await session.client
      .from('music_artists')
      .select('slug')
      .eq('id', (album as { artist_id: string }).artist_id)
      .maybeSingle();
    revalidateMusic({
      albumSlug: (album as { slug: string }).slug,
      artistSlug: (artist as { slug: string } | null)?.slug,
    });
  }

  return { ok: true, data: track };
}

export async function addTrackCredit(dto: AddTrackCreditDto): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const creditName = dto.creditName.trim();
  if (!creditName) return { ok: false, error: 'El crédito no puede estar vacío.' };

  const { data, error } = await session.client
    .from('music_track_credits')
    .insert({
      track_id: dto.trackId,
      role: dto.role,
      credit_name: creditName,
      artist_id: dto.artistId ?? null,
    })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: { id: (data as { id: string }).id } };
}

// ─────────────────────────────────────────────────────────────────────────────
// Search — server actions for client-driven autocomplete.

export async function searchMusicTopHitsAction(q: string) {
  const { searchMusicTopHits } = await import('../server/music.server');
  const data = await searchMusicTopHits(q, 8);
  return { ok: true as const, data };
}

export async function searchArtistsAction(
  q: string,
): Promise<ActionResult<MusicArtistRow[]>> {
  const { searchArtists } = await import('../server/music.server');
  return { ok: true, data: await searchArtists(q, 12) };
}

export async function searchLabelsAction(
  q: string,
): Promise<ActionResult<MusicLabelRow[]>> {
  const { searchLabels } = await import('../server/music.server');
  return { ok: true, data: await searchLabels(q, 12) };
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

export async function findOrCreateLabelAction(
  dto: CreateLabelDto,
): Promise<ActionResult<MusicLabelRow>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  const name = dto.name.trim();
  if (!name) return { ok: false, error: 'El nombre del sello es obligatorio.' };

  const { data: existing } = await session.client
    .from('music_labels')
    .select('*')
    .ilike('name', name)
    .limit(1)
    .maybeSingle();
  if (existing) return { ok: true, data: existing as MusicLabelRow };

  return createLabel(dto);
}

/** Bulk-insert tracks under one album. HEAD-validates each R2 key, inserts
 *  rows in a single round trip, and fires the audit edge function once per
 *  successful track via after(). Returns partial successes so the caller can
 *  show "3 de 4 publicadas" if one fails. */
export async function createTracksBatchAction(
  albumId: string,
  items: CreateTrackBatchItem[],
): Promise<
  ActionResult<{ trackIds: string[]; failed: Array<{ position: number; error: string }> }>
> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  if (items.length === 0) return { ok: false, error: 'Sin canciones para guardar.' };

  // Validate every R2 object exists before inserting any row. If a single
  // file is missing, we fail the whole batch — half-published albums are worse
  // than retrying the upload.
  const MAX_AUDIO_BYTES = 200 * 1024 * 1024;
  for (const it of items) {
    const head = await headAudio(it.r2Key);
    if (!head.exists) {
      return {
        ok: false,
        error: `El audio de "${it.title}" no se encontró en el almacenamiento.`,
      };
    }
    if (head.sizeBytes > MAX_AUDIO_BYTES) {
      return {
        ok: false,
        error: `El archivo de "${it.title}" supera 200 MB.`,
      };
    }
  }

  const trackIds: string[] = [];
  const r2KeysByTrackId: string[] = [];
  const failed: Array<{ position: number; error: string }> = [];

  for (const it of items) {
    const title = it.title.trim();
    if (!title) {
      failed.push({ position: it.position, error: 'Título vacío.' });
      continue;
    }
    const { data, error } = await session.client
      .from('music_tracks')
      .insert({
        album_id: albumId,
        position: it.position,
        side: it.side ?? null,
        title,
        duration_seconds: it.durationSeconds ?? null,
        r2_key: it.r2Key,
        format: it.format,
        source_media: it.sourceMedia ?? null,
        copyright_status: it.copyrightStatus,
        contributor_attestation: true,
        contributed_by: session.userId,
        restored_by_note: it.restoredByNote?.trim() || null,
      })
      .select('id')
      .single();
    if (error) {
      failed.push({ position: it.position, error: error.message });
      continue;
    }
    trackIds.push((data as { id: string }).id);
    r2KeysByTrackId.push(it.r2Key);
  }

  fireTrackAuditAfter(
    trackIds.map((id, idx) => ({
      trackId: id,
      r2Key: r2KeysByTrackId[idx]!,
      contributorId: session.userId,
    })),
  );

  // Revalidate the album page (look up its slug for path-based revalidation).
  const { data: album } = await session.client
    .from('music_albums')
    .select('slug')
    .eq('id', albumId)
    .maybeSingle();
  if (album) {
    revalidateMusic({ albumSlug: (album as { slug: string }).slug });
  }

  return { ok: true, data: { trackIds, failed } };
}

// ─────────────────────────────────────────────────────────────────────────────
// Audio URL signing — public endpoint for the player. Returns a short-lived
// presigned R2 GET URL. Anyone can call this; the audio itself is meant to be
// publicly playable (público abierto).

export async function getTrackPlayUrl(trackId: string): Promise<ActionResult<{ url: string }>> {
  try {
    const client = await getServerClient();
    const { data: track } = await client
      .from('music_tracks')
      .select('r2_key')
      .eq('id', trackId)
      .maybeSingle();
    const r2Key = (track as { r2_key: string } | null)?.r2_key;
    if (!r2Key) return { ok: false, error: 'Pista no encontrada.' };
    const url = await getPublicAudioUrl(r2Key, 3600);
    return { ok: true, data: { url } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo firmar la URL.' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Play tracking — fire-and-forget, bypass RLS via service client (write-only counter).

export async function incrementPlayCount(trackId: string): Promise<{ ok: true }> {
  try {
    const service = getServiceClient();
    // Atomic increment via raw SQL through .rpc would be cleanest; for MVP this
    // optimistic update is fine. If it races we lose at most a few counts.
    const { data: row } = await service
      .from('music_tracks')
      .select('play_count')
      .eq('id', trackId)
      .maybeSingle();
    const next = ((row as { play_count: number } | null)?.play_count ?? 0) + 1;
    await service.from('music_tracks').update({ play_count: next }).eq('id', trackId);
  } catch {
    // best-effort; never blocks playback
  }
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Music importer — admin-only Firecrawl + archive.org pipeline.
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
        fmt === 'flac' ? 'audio/flac' :
        fmt === 'wav' ? 'audio/wav' :
        fmt === 'ogg' ? 'audio/ogg' : 'audio/mpeg';
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
