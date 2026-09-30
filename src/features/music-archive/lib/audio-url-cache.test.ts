import { describe, expect, it, vi } from 'vitest';
import { AudioSessionChangedError, MusicAudioUrlCache } from './audio-url-cache';
import type { MusicAudioUrl } from '../types/music/audio-url.types';

const entry = (viewerId: string | null = 'alice', url = 'https://test.r2.cloudflarestorage.com/song') => ({
  url, viewerId, serverTime: 1_000_000, expiresAt: 4_600_000,
});
function setup() {
  let wall = 0;
  let monotonic = 0;
  const sign = vi.fn<() => Promise<MusicAudioUrl>>().mockResolvedValue(entry());
  const cache = new MusicAudioUrlCache(sign, () => wall, () => monotonic);
  cache.reset('alice');
  return { cache, sign, advance(ms: number) { wall += ms; monotonic += ms; },
    setWall(ms: number) { wall = ms; } };
}

describe('music-only session URL reuse', () => {
  it('does not sign until first get and reuses the exact valid URL', async () => {
    const { cache, sign, advance } = setup();
    expect(sign).not.toHaveBeenCalled();
    const first = await cache.get('track-a');
    advance(60_000);
    expect(await cache.get('track-a')).toMatchObject(first);
    expect(sign).toHaveBeenCalledTimes(1);
  });
  it('coalesces concurrent callers for the same track', async () => {
    const { cache, sign } = setup();
    await Promise.all([cache.get('a'), cache.get('a'), cache.get('a')]);
    expect(sign).toHaveBeenCalledTimes(1);
  });
  it('isolates track IDs', async () => {
    const { cache, sign } = setup();
    await Promise.all([cache.get('a'), cache.get('b')]);
    expect(sign).toHaveBeenCalledTimes(2);
  });
  it('renews at the 60 second boundary, including after long idle', async () => {
    const { cache, sign, advance } = setup();
    await cache.get('a');
    advance(3_540_000);
    await cache.get('a');
    expect(sign).toHaveBeenCalledTimes(2);
    advance(4_000_000);
    await cache.get('a');
    expect(sign).toHaveBeenCalledTimes(3);
  });
  it('uses relative server lifetime, not the client clock', async () => {
    const { cache, setWall } = setup();
    setWall(99_000_000_000);
    await cache.get('a');
    expect(cache.remaining('a')).toBe(3_600_000);
  });
  it('does not extend expiry after clock rollback', async () => {
    const { cache, advance, setWall, sign } = setup();
    await cache.get('a');
    advance(3_550_000);
    setWall(-500_000);
    await cache.get('a');
    expect(sign).toHaveBeenCalledTimes(2);
  });
  it('counts request latency against the usable TTL', async () => {
    const { cache, sign, advance } = setup();
    sign.mockImplementation(async () => { advance(5_000); return entry(); });
    await cache.get('a');
    expect(cache.remaining('a')).toBe(3_595_000);
  });
  it('does not cache failures and allows a fresh user retry', async () => {
    const { cache, sign } = setup();
    sign.mockRejectedValueOnce(new Error('denied'));
    await expect(cache.get('a')).rejects.toThrow('denied');
    await cache.get('a');
    expect(sign).toHaveBeenCalledTimes(2);
  });
  it('rejects a response from a different authenticated viewer', async () => {
    const { cache, sign } = setup();
    sign.mockResolvedValue(entry('bob'));
    await expect(cache.get('a')).rejects.toBeInstanceOf(AudioSessionChangedError);
    expect(cache.remaining('a')).toBe(0);
  });
  it('supports a separate anonymous session', async () => {
    const { cache, sign } = setup();
    cache.reset(null);
    sign.mockResolvedValue(entry(null));
    await cache.get('a');
    cache.reset('alice');
    sign.mockResolvedValue(entry());
    await cache.get('a');
    expect(sign).toHaveBeenCalledTimes(2);
  });
  it('drops an in-flight response after logout or same-user re-login', async () => {
    const { cache, sign } = setup();
    let resolve!: (entry: MusicAudioUrl) => void;
    sign.mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
    const old = cache.get('a');
    cache.reset('alice');
    await cache.get('a');
    resolve(entry());
    await expect(old).rejects.toBeInstanceOf(AudioSessionChangedError);
    expect(await cache.get('a')).toMatchObject(entry());
    expect(sign).toHaveBeenCalledTimes(2);
  });
  it('does not let an old finally remove a new session pending request', async () => {
    const { cache, sign } = setup();
    const resolvers: Array<(entry: MusicAudioUrl) => void> = [];
    sign.mockImplementation(() => new Promise((resolve) => resolvers.push(resolve)));
    const old = cache.get('a');
    cache.reset('alice');
    const fresh = cache.get('a');
    resolvers[0](entry());
    await expect(old).rejects.toBeInstanceOf(AudioSessionChangedError);
    const duplicate = cache.get('a');
    resolvers[1](entry());
    await Promise.all([fresh, duplicate]);
    expect(sign).toHaveBeenCalledTimes(2);
  });
  it('blocks use before a session is established', async () => {
    const { cache, sign } = setup();
    cache.reset();
    await expect(cache.get('a')).rejects.toBeInstanceOf(AudioSessionChangedError);
    expect(sign).not.toHaveBeenCalled();
  });
  it.each([NaN, 0, 60_000, 3_600_001])('rejects unsafe TTL %s', async (ttl) => {
    const { cache, sign } = setup();
    sign.mockResolvedValue({ ...entry(), expiresAt: 1_000_000 + ttl });
    await expect(cache.get('a')).rejects.toThrow('Invalid audio URL');
  });
  it('invalidates one failed URL without dropping unrelated tracks', async () => {
    const { cache, sign } = setup();
    await cache.get('a'); await cache.get('b');
    cache.invalidate('a');
    await cache.get('a'); await cache.get('b');
    expect(sign).toHaveBeenCalledTimes(3);
  });
  it('caps retained entries', async () => {
    const { cache, sign } = setup();
    for (let i = 0; i < 129; i++) await cache.get(String(i));
    await cache.get('0');
    expect(sign).toHaveBeenCalledTimes(130);
  });
});
