import 'server-only';
import { createHash } from 'node:crypto';
import { signMusicCache } from './music-cache-signature';

function config() {
  const origin = process.env.MUSIC_CACHE_ORIGIN;
  const secret = process.env.MUSIC_CACHE_SECRET;
  if (!origin || !secret || secret.length < 32) return null;
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/') {
    throw new Error('MUSIC_CACHE_ORIGIN must be an HTTPS origin');
  }
  return { origin: url.origin, secret };
}

export async function musicCacheUrl(path: string, method = 'GET', ttlSeconds = 3600) {
  const settings = config();
  if (!settings) return null;
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const url = new URL(path, settings.origin);
  url.searchParams.set('expires', String(expires));
  url.searchParams.set('signature', await signMusicCache(settings.secret, method, url.pathname, expires));
  return { url: url.href, expiresAt: expires * 1000, serverTime: Date.now() };
}

export function musicSearchCacheKey(viewerId: string | null, query: string, limit: number) {
  return createHash('sha256').update(JSON.stringify([viewerId, query, limit])).digest('hex');
}

/** Cache failure must never prevent a database search. Signed URLs stay server-only. */
export async function readMusicSearchCache<T>(key: string): Promise<T | null> {
  try {
    const signed = await musicCacheUrl(`/search/v1/${key}`, 'GET', 60);
    if (!signed) return null;
    const response = await fetch(signed.url, { cache: 'no-store', signal: AbortSignal.timeout(800) });
    return response.ok ? await response.json() as T : null;
  } catch { return null; }
}

export async function writeMusicSearchCache(key: string, value: unknown): Promise<void> {
  try {
    const signed = await musicCacheUrl(`/search/v1/${key}`, 'PUT', 60);
    if (!signed) return;
    await fetch(signed.url, { method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value), cache: 'no-store', signal: AbortSignal.timeout(800) });
  } catch { /* A best-effort cache never replaces the source of truth. */ }
}
