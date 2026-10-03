import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { musicCacheUrl, musicSearchCacheKey, readMusicSearchCache, writeMusicSearchCache } from './music-cache';
import { verifyMusicCache } from './music-cache-signature';

beforeEach(() => {
  vi.stubEnv('MUSIC_CACHE_ORIGIN', 'https://music-cache.example.test');
  vi.stubEnv('MUSIC_CACHE_SECRET', 'test-secret-with-at-least-thirty-two-characters');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('music edge cache boundary', () => {
  it('signs only the requested path, method and expiry', async () => {
    const signed = await musicCacheUrl('/audio/v1/key%2Fsong.mp3');
    const url = new URL(signed!.url);
    const secret = process.env.MUSIC_CACHE_SECRET!;
    expect(await verifyMusicCache(secret, 'GET', url)).toBe(true);
    expect(await verifyMusicCache(secret, 'PUT', url)).toBe(false);
    url.pathname = '/audio/v1/private.pdf';
    expect(await verifyMusicCache(secret, 'GET', url)).toBe(false);
    expect(signed!.expiresAt - signed!.serverTime).toBeLessThanOrEqual(3_600_000);
  });
  it('refuses expired and excessively long-lived signatures', async () => {
    for (const ttl of [-1, 3602]) {
      const signed = await musicCacheUrl('/audio/v1/song', 'GET', ttl);
      expect(await verifyMusicCache(process.env.MUSIC_CACHE_SECRET!, 'GET', new URL(signed!.url))).toBe(false);
    }
  });
  it('separates user, guest, query and result-size cache entries', () => {
    const keys = [musicSearchCacheKey(null, 'bolero', 12), musicSearchCacheKey('a', 'bolero', 12),
      musicSearchCacheKey('b', 'bolero', 12), musicSearchCacheKey('a', 'bolero', 30),
      musicSearchCacheKey('a', 'salsa', 12)];
    expect(new Set(keys).size).toBe(5);
    expect(keys.every((key) => /^[a-f0-9]{64}$/.test(key))).toBe(true);
  });
  it('keeps the direct path available when cache configuration is absent', async () => {
    vi.stubEnv('MUSIC_CACHE_ORIGIN', '');
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    expect(await musicCacheUrl('/audio/v1/song')).toBeNull();
    expect(await readMusicSearchCache('key')).toBeNull();
    await writeMusicSearchCache('key', []);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('returns a miss and tolerates writes when Cloudflare is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await readMusicSearchCache('key')).toBeNull();
    await expect(writeMusicSearchCache('key', [])).resolves.toBeUndefined();
  });
});
