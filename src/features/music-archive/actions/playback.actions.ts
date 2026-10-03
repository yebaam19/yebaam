'use server';

import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import { getSignedFileUrl } from '@/lib/cloudflare/r2';
import { musicCacheUrl } from '@/lib/cloudflare/music-cache';
import { z } from 'zod';
import { MUSIC_CLUB_ENABLED } from '../config';
import type { MusicAudioUrl } from '../types/music/audio-url.types';
import type { ActionResult } from './_shared';

const trackIdSchema = z.uuid();
const PLAYBACK_ERROR = 'No se pudo cargar el audio.';

/** Public endpoint for the player. Returns a short-lived signed edge URL
 *  (direct R2 when the cache is disabled). The audio is meant to be publicly
 *  playable (público abierto). Every signing request still checks caller RLS. */
export async function getTrackPlayUrl(trackId: string): Promise<ActionResult<MusicAudioUrl>> {
  if (!MUSIC_CLUB_ENABLED) {
    return { ok: false, error: 'El Club de Coleccionistas no está disponible.' };
  }
  if (!trackIdSchema.safeParse(trackId).success) {
    return { ok: false, error: 'Pista no válida.' };
  }
  try {
    const client = await getServerClient();
    const { data: auth, error: authError } = await client.auth.getUser();
    // No session is normal for this public action. Never downgrade an auth
    // outage, invalid token, or other verification failure to anonymous reuse.
    const missingSession = authError?.name === 'AuthSessionMissingError'
      && authError.status === 400 && !auth.user;
    if (authError && !missingSession) return { ok: false, error: PLAYBACK_ERROR };

    const { data: track, error } = await client
      .from('music_tracks')
      .select('r2_key')
      .eq('id', trackId)
      .maybeSingle();
    if (error) return { ok: false, error: PLAYBACK_ERROR };
    const r2Key = (track as { r2_key: string } | null)?.r2_key;
    if (typeof r2Key !== 'string' || !r2Key.trim()) {
      return { ok: false, error: 'Pista no encontrada.' };
    }
    const signed = await musicCacheUrl(`/audio/v1/${encodeURIComponent(r2Key)}`)
      ?? await getSignedFileUrl(r2Key, 3600);
    return { ok: true, data: { ...signed, viewerId: auth.user?.id ?? null } };
  } catch {
    return { ok: false, error: PLAYBACK_ERROR };
  }
}

/** Fire-and-forget play counter. Bypasses RLS via service client (write-only). */
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
