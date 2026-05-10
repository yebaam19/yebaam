'use server';

import { getServerClient } from '@/utils/supabase/server';
import type {
  MusicArtistRow,
  MusicLabelRow,
  MusicSearchHit,
} from '../types/music.types';
import type { ActionResult } from './_shared';

/** Throttle search-as-you-type so a runaway browser tab can't hammer Postgres.
 *  60 requests / 60s / caller is generous for a debounced UI (≥300ms) but
 *  blocks abuse. Anonymous callers share a key per source IP. */
async function gateSearchRate(): Promise<{ ok: true } | { ok: false; error: string }> {
  const { headers } = await import('next/headers');
  const { checkRateLimit } = await import('@/lib/api/rate-limit');
  const h = await headers();
  const xff = h.get('x-forwarded-for');
  const ip = xff ? xff.split(',')[0]!.trim() : (h.get('x-real-ip') ?? 'unknown');

  // If the caller is signed in we key on user id so multiple devices behind
  // the same NAT don't trip each other; otherwise we fall back to IP.
  const client = await getServerClient();
  const { data } = await client.auth.getUser();
  const key = data.user ? `music-search:user:${data.user.id}` : `music-search:ip:${ip}`;

  const result = checkRateLimit(key, { limit: 60, windowMs: 60_000 });
  if (!result.ok) {
    return {
      ok: false,
      error: 'Demasiadas búsquedas. Intenta de nuevo en un momento.',
    };
  }
  return { ok: true };
}

export async function searchMusicTopHitsAction(
  q: string,
): Promise<ActionResult<MusicSearchHit[]>> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return { ok: true, data: [] };

  const gate = await gateSearchRate();
  if (!gate.ok) return gate;

  const { searchMusicTopHits } = await import('../server/music.server');
  const data = await searchMusicTopHits(trimmed, 8);
  return { ok: true, data };
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
