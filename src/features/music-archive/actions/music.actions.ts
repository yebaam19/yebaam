'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import { headAudio, getPublicAudioUrl, uploadAudioFromUrl, deleteAudio } from '@/lib/cloudflare/r2';
import { uploadImageFromUrl, deleteImage } from '@/lib/cloudflare/images';
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
  UpdateAlbumDto,
  UpdateArtistDto,
  UpdateLabelDto,
  UpdateTrackDto,
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

// ─────────────────────────────────────────────────────────────────────────────
// Admin CRUD — every update/delete below requires platform admin. Deletes
// also clean up Cloudflare R2 audio + Cloudflare Images covers so we don't
// orphan media on the CDN. The DB has on-delete-cascade for albums→tracks
// and artists→albums, so a single DELETE can fan out — we collect the
// affected R2 keys + image IDs first, then delete in DB, then clean media.

async function adminGate(): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string }
> {
  const admin = await requirePlatformAdmin();
  if (!admin) return { ok: false, error: 'Solo administradores.' };
  return { ok: true, userId: admin.userId };
}

// ─── Artists ────────────────────────────────────────────────────────────────

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
    const r = alb as { cover_cf_image_id: string | null; back_cover_cf_image_id: string | null; label_cf_image_id: string | null };
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

// ─── Albums ─────────────────────────────────────────────────────────────────

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
  if (dto.country !== undefined) patch.country = dto.country?.trim().toUpperCase().slice(0, 2) || null;
  if (dto.format !== undefined) patch.format = dto.format;
  if (dto.artistId !== undefined) patch.artist_id = dto.artistId;
  if (dto.labelId !== undefined) patch.label_id = dto.labelId;
  if (dto.coverCfImageId !== undefined) patch.cover_cf_image_id = dto.coverCfImageId;
  if (dto.backCoverCfImageId !== undefined) patch.back_cover_cf_image_id = dto.backCoverCfImageId;
  if (dto.labelCfImageId !== undefined) patch.label_cf_image_id = dto.labelCfImageId;
  if (dto.catalogNumber !== undefined) patch.catalog_number = dto.catalogNumber?.trim() || null;
  if (dto.notes !== undefined) patch.notes = dto.notes?.trim() || null;
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
  const a = album as { cover_cf_image_id: string | null; back_cover_cf_image_id: string | null; label_cf_image_id: string | null; slug: string } | null;
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

// ─── Tracks ─────────────────────────────────────────────────────────────────

export async function updateTrack(
  id: string,
  dto: UpdateTrackDto,
): Promise<ActionResult<MusicTrackRow>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();
  const patch: Record<string, unknown> = {};
  if (dto.title !== undefined) patch.title = dto.title.trim();
  if (dto.position !== undefined) patch.position = dto.position;
  if (dto.side !== undefined) patch.side = dto.side;
  if (dto.durationSeconds !== undefined) patch.duration_seconds = dto.durationSeconds;
  if (dto.sourceMedia !== undefined) patch.source_media = dto.sourceMedia;
  if (dto.copyrightStatus !== undefined) patch.copyright_status = dto.copyrightStatus;
  if (dto.restoredByNote !== undefined) patch.restored_by_note = dto.restoredByNote?.trim() || null;
  const { data, error } = await service
    .from('music_tracks')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return { ok: false, error: error.message };
  const row = data as MusicTrackRow;

  const { data: alb } = await service
    .from('music_albums')
    .select('slug')
    .eq('id', row.album_id)
    .maybeSingle();
  if (alb) revalidateMusic({ albumSlug: (alb as { slug: string }).slug });
  return { ok: true, data: row };
}

export async function deleteTrack(id: string): Promise<ActionResult<{ deleted: true }>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();

  const { data: track } = await service
    .from('music_tracks')
    .select('r2_key, album_id')
    .eq('id', id)
    .maybeSingle();
  const t = track as { r2_key: string; album_id: string } | null;

  const { error } = await service.from('music_tracks').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  if (t?.r2_key) {
    after(async () => {
      try { await deleteAudio(t.r2_key); } catch (e) { console.warn('[deleteTrack] r2:', e); }
    });
  }

  if (t?.album_id) {
    const { data: alb } = await service
      .from('music_albums')
      .select('slug')
      .eq('id', t.album_id)
      .maybeSingle();
    if (alb) revalidateMusic({ albumSlug: (alb as { slug: string }).slug });
  }
  return { ok: true, data: { deleted: true } };
}

/** Swap an existing track's audio file. The new R2 key has already been
 *  uploaded by the caller (uploadService.uploadAudio) — we HEAD-validate it,
 *  point the row at it, and best-effort delete the old R2 object. */
export async function replaceTrackAudio(
  trackId: string,
  dto: { r2Key: string; format: 'mp3' | 'flac' | 'wav' | 'ogg'; durationSeconds: number | null },
): Promise<ActionResult<MusicTrackRow>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();

  const head = await headAudio(dto.r2Key);
  if (!head.exists) {
    return { ok: false, error: 'El audio no se encontró en el almacenamiento.' };
  }
  const MAX_AUDIO_BYTES = 200 * 1024 * 1024;
  if (head.sizeBytes > MAX_AUDIO_BYTES) {
    return { ok: false, error: 'El archivo supera 200 MB.' };
  }

  const { data: existing } = await service
    .from('music_tracks')
    .select('r2_key, album_id')
    .eq('id', trackId)
    .maybeSingle();
  const oldKey = (existing as { r2_key: string; album_id: string } | null)?.r2_key;

  const { data, error } = await service
    .from('music_tracks')
    .update({
      r2_key: dto.r2Key,
      format: dto.format,
      duration_seconds: dto.durationSeconds,
    })
    .eq('id', trackId)
    .select('*')
    .single();
  if (error) return { ok: false, error: error.message };
  const row = data as MusicTrackRow;

  if (oldKey && oldKey !== dto.r2Key) {
    after(async () => {
      try { await deleteAudio(oldKey); } catch (e) { console.warn('[replaceTrackAudio] r2 cleanup:', e); }
    });
  }

  // Audit the new audio object the same way createTrack does.
  fireTrackAuditAfter([{ trackId: row.id, r2Key: row.r2_key, contributorId: gate.userId }]);

  // Revalidate the album page so the new presigned URL is picked up.
  const { data: alb } = await service
    .from('music_albums')
    .select('slug')
    .eq('id', row.album_id)
    .maybeSingle();
  if (alb) revalidateMusic({ albumSlug: (alb as { slug: string }).slug });

  return { ok: true, data: row };
}

// ─── Labels ─────────────────────────────────────────────────────────────────

export async function updateLabel(
  id: string,
  dto: UpdateLabelDto,
): Promise<ActionResult<MusicLabelRow>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();
  const patch: Record<string, unknown> = {};
  if (dto.name !== undefined) patch.name = dto.name.trim();
  if (dto.country !== undefined) patch.country = dto.country?.trim().toUpperCase().slice(0, 2) || null;
  if (dto.founded !== undefined) patch.founded = dto.founded;
  const { data, error } = await service
    .from('music_labels')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as MusicLabelRow };
}

export async function deleteLabel(id: string): Promise<ActionResult<{ deleted: true }>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();
  // Albums.label_id is on-delete-set-null, so no media cleanup needed —
  // albums survive, just disconnected from the deleted label.
  const { error } = await service.from('music_labels').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/musica');
  return { ok: true, data: { deleted: true } };
}

// ─── Admin list reads (search-friendly) ─────────────────────────────────────

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
    .select('id, title, slug, year, country, format, cover_cf_image_id, catalog_number, artist_id, music_artists!inner(name)')
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
    artist_id: string;
    music_artists: { name: string } | { name: string }[];
  };
  const rows = (data ?? []) as unknown as Row[];

  // Track counts in one round-trip rather than N+1.
  const albumIds = rows.map((r) => r.id);
  let countsByAlbum = new Map<string, number>();
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
        artist_id: r.artist_id,
        artist_name: artist?.name ?? 'Desconocido',
        track_count: countsByAlbum.get(r.id) ?? 0,
      };
    }),
  };
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
    .select('id, name, slug, country, born_year, died_year, photo_cf_image_id')
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

export async function listAdminLabels(q?: string): Promise<
  ActionResult<
    Array<{
      id: string;
      name: string;
      slug: string;
      country: string | null;
      founded: number | null;
      album_count: number;
    }>
  >
> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();
  let query = service
    .from('music_labels')
    .select('id, name, slug, country, founded')
    .order('name', { ascending: true })
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
    founded: number | null;
  }>;

  const labelIds = rows.map((r) => r.id);
  const counts = new Map<string, number>();
  if (labelIds.length > 0) {
    const { data: albs } = await service
      .from('music_albums')
      .select('label_id')
      .in('label_id', labelIds);
    for (const a of (albs ?? []) as Array<{ label_id: string }>) {
      counts.set(a.label_id, (counts.get(a.label_id) ?? 0) + 1);
    }
  }

  return { ok: true, data: rows.map((r) => ({ ...r, album_count: counts.get(r.id) ?? 0 })) };
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
