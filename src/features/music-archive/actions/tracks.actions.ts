'use server';

import { after } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServiceClient } from '@/utils/supabase/server';
import { deleteAudio, headAudio } from '@/lib/cloudflare/r2';
import type {
  AddTrackCreditDto,
  CreateTrackBatchItem,
  CreateTrackDto,
  MusicTrackRow,
  MusicTrackSide,
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

/** The DB enforces UNIQUE (album_id, position, side). Surface that as a human
 *  sentence instead of the raw Postgres "duplicate key value" message. Also
 *  maps the sentinel messages raised by the placement RPCs. */
function friendlyTrackError(error: { code?: string; message: string }): string {
  if (error.code === '23505') {
    return 'Ya hay una canción en esa posición del disco. Elige otra posición.';
  }
  if (error.message.includes('TRACK_NOT_FOUND')) return 'Canción no encontrada.';
  if (error.message.includes('ALBUM_NOT_FOUND')) return 'Álbum no encontrado.';
  return error.message;
}

/** Same ordering the album page and the admin editor use, so lists returned by
 *  the shift actions drop straight into client state. Errors are propagated —
 *  coercing a failed query to [] would wipe the caller's tracklist. */
async function fetchAlbumTracksSorted(
  client: SupabaseClient,
  albumId: string,
): Promise<{ tracks: MusicTrackRow[]; error: string | null }> {
  const { data, error } = await client
    .from('music_tracks')
    .select('*')
    .eq('album_id', albumId)
    .order('side', { ascending: true, nullsFirst: true })
    .order('position', { ascending: true });
  if (error) return { tracks: [], error: error.message };
  return { tracks: (data as MusicTrackRow[] | null) ?? [], error: null };
}

/** HEAD-validate an already-uploaded R2 object before pointing a row at it.
 *  Shared by every insert/replace path. Returns an error string or null. */
async function validateAudioObject(r2Key: string): Promise<string | null> {
  const head = await headAudio(r2Key);
  if (!head.exists) {
    return 'El audio no se encontró en el almacenamiento. Vuelve a subir el archivo.';
  }
  if (head.sizeBytes > MAX_AUDIO_BYTES) {
    return 'El archivo supera el tamaño máximo permitido (200 MB).';
  }
  return null;
}

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
  const audioError = await validateAudioObject(dto.r2Key);
  if (audioError) return { ok: false, error: audioError };

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
  if (error) return { ok: false, error: friendlyTrackError(error) };
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
      if (error) return { it, id: null, error: friendlyTrackError(error) };
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
  if (error) return { ok: false, error: friendlyTrackError(error) };
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

  const audioError = await validateAudioObject(dto.r2Key);
  if (audioError) return { ok: false, error: audioError };

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

/** Insert a track at an exact position on an existing album, shifting every
 *  track of the same side at that position or below down by one — the "quiero
 *  ubicarla en el espacio que es" case the plain `createTrack` can't serve
 *  because of UNIQUE (album_id, position, side). Admin-only (it renumbers other
 *  contributors' rows). The lock + normalize + shift + insert runs atomically
 *  inside the `music_insert_track_at` Postgres function. Returns the album's
 *  full re-sorted tracklist so the editor can replace its state wholesale. */
export async function adminInsertTrackAt(
  dto: CreateTrackDto,
): Promise<ActionResult<{ track: MusicTrackRow; tracks: MusicTrackRow[] }>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const title = dto.title.trim();
  if (!title) return { ok: false, error: 'El título es obligatorio.' };
  const service = getServiceClient();

  const audioError = await validateAudioObject(dto.r2Key);
  if (audioError) return { ok: false, error: audioError };

  const { data, error } = await service.rpc('music_insert_track_at', {
    p_album_id: dto.albumId,
    p_position: Math.max(1, Math.floor(dto.position)),
    p_side: dto.side ?? null,
    p_title: title,
    p_r2_key: dto.r2Key,
    p_format: dto.format,
    p_copyright_status: dto.copyrightStatus,
    p_contributed_by: gate.userId,
    p_duration_seconds: dto.durationSeconds ?? null,
    p_bitrate_kbps: dto.bitrateKbps ?? null,
    p_source_media: dto.sourceMedia ?? null,
    p_restored_by_note: dto.restoredByNote?.trim() || null,
  });
  if (error) return { ok: false, error: friendlyTrackError(error) };
  const track = data as MusicTrackRow;

  fireTrackAuditAfter([
    { trackId: track.id, r2Key: track.r2_key, contributorId: gate.userId },
  ]);
  await revalidateAlbumById(service, dto.albumId, { withArtist: true });

  const after_ = await fetchAlbumTracksSorted(service, dto.albumId);
  if (after_.error) {
    // The insert itself landed — tell the admin to reload rather than pretend
    // success with an empty list (which would wipe the editor's tracklist).
    return {
      ok: false,
      error: 'La canción se guardó, pero no se pudo recargar la lista. Cierra y vuelve a abrir el editor.',
    };
  }
  return { ok: true, data: { track, tracks: after_.tracks } };
}

/** Move an existing track to an exact (position, side) slot — list-move
 *  semantics: the old slot closes up, the new slot opens, and the track ends at
 *  exactly the requested position. Optional field patches ride along so the
 *  editor's "Guardar" stays one call; they travel as jsonb so an explicit null
 *  ("clear the note") stays distinguishable from "not provided". Admin-only.
 *  The whole reshuffle runs atomically inside the `music_move_track` Postgres
 *  function. Returns the full re-sorted tracklist. */
export async function adminMoveTrack(
  trackId: string,
  dto: {
    position: number;
    side: MusicTrackSide | null;
    title?: string;
    copyrightStatus?: UpdateTrackDto['copyrightStatus'];
    sourceMedia?: UpdateTrackDto['sourceMedia'];
    restoredByNote?: string | null;
  },
): Promise<ActionResult<{ tracks: MusicTrackRow[] }>> {
  const gate = await adminGate();
  if (!gate.ok) return gate;
  const service = getServiceClient();

  const fieldPatch: Record<string, unknown> = {};
  if (dto.title !== undefined) fieldPatch.title = dto.title.trim();
  if (dto.copyrightStatus !== undefined) fieldPatch.copyright_status = dto.copyrightStatus;
  if (dto.sourceMedia !== undefined) fieldPatch.source_media = dto.sourceMedia;
  if (dto.restoredByNote !== undefined)
    fieldPatch.restored_by_note = dto.restoredByNote?.trim() || null;

  const { data, error } = await service.rpc('music_move_track', {
    p_track_id: trackId,
    p_position: Math.max(1, Math.floor(dto.position)),
    p_side: dto.side ?? null,
    p_patch: fieldPatch,
  });
  if (error) return { ok: false, error: friendlyTrackError(error) };
  const moved = data as MusicTrackRow;

  await revalidateAlbumById(service, moved.album_id);
  const after_ = await fetchAlbumTracksSorted(service, moved.album_id);
  if (after_.error) {
    return {
      ok: false,
      error: 'El cambio se guardó, pero no se pudo recargar la lista. Cierra y vuelve a abrir el editor.',
    };
  }
  return { ok: true, data: { tracks: after_.tracks } };
}
