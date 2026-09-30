import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getTrackPlayUrl } from '../actions/playback.actions';
import { musicAudioUrls } from './audio-url-session';
vi.mock('../actions/playback.actions', () => ({ getTrackPlayUrl: vi.fn() }));
beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); musicAudioUrls.reset(null); });
afterEach(() => { musicAudioUrls.reset(); vi.useRealTimers(); });
describe('signing request timeout', () => {
  it('releases a hung request and permits a retry without late cache insertion', async () => {
    let resolve!: (data: Awaited<ReturnType<typeof getTrackPlayUrl>>) => void;
    vi.mocked(getTrackPlayUrl).mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
    const old = musicAudioUrls.get('a');
    const rejected = expect(old).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(15_000);
    await rejected;
    const data = { url: 'https://test.r2.cloudflarestorage.com/fresh', expiresAt: 3_600_000,
      serverTime: 0, viewerId: null };
    vi.mocked(getTrackPlayUrl).mockResolvedValue({ ok: true, data });
    expect(await musicAudioUrls.get('a')).toMatchObject(data);
    resolve({ ok: true, data: { ...data, url: 'https://test.r2.cloudflarestorage.com/late' } });
    await Promise.resolve();
    expect(await musicAudioUrls.get('a')).toMatchObject(data);
    expect(getTrackPlayUrl).toHaveBeenCalledTimes(2);
  });
});
