'use server';

import { getServerClient, getServiceClient } from '@/utils/supabase/server';
import { getPublicAudioUrl } from '@/lib/cloudflare/r2';
import type { ActionResult } from './_shared';

/** Public endpoint for the player. Returns a short-lived presigned R2 GET
 *  URL. Anyone can call this; the audio itself is meant to be publicly
 *  playable (público abierto). */
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
