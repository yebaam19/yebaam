'use server';

import { after } from 'next/server';
import { getServiceClient } from '@/utils/supabase/server';
import { deleteAudio, headAudio } from '@/lib/cloudflare/r2';
import type {
  AddTrackCreditDto,
  CreateTrackBatchItem,
  CreateTrackDto,
  MusicTrackRow,
  UpdateTrackDto,
} from '../types/music.types';
import {
  adminGate,
  fireTrackAuditAfter,
  MAX_AUDIO_BYTES,
  requireSession,
  revalidateAlbumById,
  type ActionResult,
} from './_shared';

export async function createTrack(
  dto: CreateTrackDto,
): Promise<ActionResult<MusicTrackRow>> {
  const session = await requireSession();
  if (!session) return { ok: false, error: 'Debes iniciar sesión.' };
  if (!dto.contributorAttestation) {
    return {
      ok: false,
      error:
        'Debes confirmar que tienes derechos sobre esta grabación o que es de dominio público.',
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

  await revalidateAlbumById(session.client, dto.albumId, { withArtist: true });

  return { ok: true, data: track };
}

export async function addTrackCredit(
  dto: AddTrackCreditDto,
): Promise<ActionResult<{ id: string }>> {
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
  // than retrying the upload. HEADs run in parallel: a 20-track album would
  // otherwise burn 20 serial round trips against the function duration limit.
  const heads = await Promise.all(
    items.map(async (it) => ({ it, head: await headAudio(it.r2Key) })),
  );
  for (const { it, head } of heads) {
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

  // Insert rows in parallel too, keeping the per-row failure reporting.
  const inserted = await Promise.all(
    items.map(async (it) => {
      const title = it.title.trim();
      if (!title) return { it, id: null, error: 'Título vacío.' };
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
      if (error) return { it, id: null, error: error.message };
      return { it, id: (data as { id: string }).id, error: null };
    }),
  );

  const trackIds: string[] = [];
  const r2KeysByTrackId: string[] = [];
  const failed: Array<{ position: number; error: string }> = [];
  for (const r of inserted) {
    if (r.id) {
      trackIds.push(r.id);
      r2KeysByTrackId.push(r.it.r2Key);
    } else {
      failed.push({ position: r.it.position, error: r.error ?? 'Error desconocido.' });
    }
  }

  fireTrackAuditAfter(
    trackIds.map((id, idx) => ({
      trackId: id,
      r2Key: r2KeysByTrackId[idx]!,
      contributorId: session.userId,
    })),
  );

  await revalidateAlbumById(session.client, albumId);

  return { ok: true, data: { trackIds, failed } };
}

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
  if (dto.restoredByNote !== undefined)
    patch.restored_by_note = dto.restoredByNote?.trim() || null;
  const { data, error } = await service
    .from('music_tracks')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return { ok: false, error: error.message };
  const row = data as MusicTrackRow;

  await revalidateAlbumById(service, row.album_id);
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
      try {
        await deleteAudio(t.r2_key);
      } catch (e) {
        console.warn('[deleteTrack] r2:', e);
      }
    });
  }

  if (t?.album_id) await revalidateAlbumById(service, t.album_id);
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
      try {
        await deleteAudio(oldKey);
      } catch (e) {
        console.warn('[replaceTrackAudio] r2 cleanup:', e);
      }
    });
  }

  // Audit the new audio object the same way createTrack does.
  fireTrackAuditAfter([{ trackId: row.id, r2Key: row.r2_key, contributorId: gate.userId }]);

  await revalidateAlbumById(service, row.album_id);
  return { ok: true, data: row };
}
