import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlayerStore } from '../components/PlayerStore';
import type { PlayItem } from '../types/music.types';
import type { MusicAudioUrl } from '../types/music/audio-url.types';
import { musicAudioUrls } from '../lib/audio-url-session';
import { AudioSessionChangedError } from '../lib/audio-url-cache';
import { useMusicAudioPlayback } from './useMusicAudioPlayback';

vi.mock('../lib/audio-url-session', () => ({ musicAudioUrls: {
  get: vi.fn(), invalidate: vi.fn(), remaining: vi.fn(() => 3_600_000),
} }));
const item = (trackId: string): PlayItem => ({ trackId, title: trackId, artistName: 'Artist',
  albumSlug: 'album', artistSlug: 'artist', coverCfId: null, durationSeconds: 240 });
const signed = (trackId: string): MusicAudioUrl => ({ url: `https://test.r2.cloudflarestorage.com/${trackId}`,
  expiresAt: 3_600_000, serverTime: 0, viewerId: null });
function Player({ ready = true }: { ready?: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  const current = usePlayerStore((s) => s.queue[s.currentIndex]);
  const error = useMusicAudioPlayback(ref, ready);
  return <>{current && <audio ref={ref} data-testid="audio" />}<span>{error ? 'failed' : ''}</span></>;
}
async function flush() { await act(async () => { await Promise.resolve(); await Promise.resolve(); }); }

beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks();
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  vi.mocked(musicAudioUrls.get).mockImplementation(async (id) => signed(id));
  usePlayerStore.getState().reset();
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('direct R2 playback lifecycle', () => {
  it('does not request a URL without a track/session', async () => {
    const view = render(<Player ready={false} />);
    act(() => usePlayerStore.getState().setQueue([item('a')]));
    await flush();
    expect(musicAudioUrls.get).not.toHaveBeenCalled();
    view.rerender(<Player ready />); await flush();
    expect(view.getByTestId('audio').getAttribute('src')).toBe(signed('a').url);
  });
  it('plays, pauses, seeks, and resumes with the same source', async () => {
    usePlayerStore.getState().setQueue([item('a')]);
    const view = render(<Player />); await flush();
    const audio = view.getByTestId('audio') as HTMLAudioElement;
    fireEvent.loadedMetadata(audio); await flush();
    act(() => usePlayerStore.getState().togglePlay()); await flush();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    act(() => usePlayerStore.getState().seek(42)); await flush();
    expect(audio.currentTime).toBe(42);
    act(() => usePlayerStore.getState().togglePlay()); await flush();
    expect(audio.getAttribute('src')).toBe(signed('a').url);
    expect(audio.play).toHaveBeenCalled();
  });
  it('ignores a late signature after a rapid track switch', async () => {
    let resolve!: (result: MusicAudioUrl) => void;
    vi.mocked(musicAudioUrls.get).mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
    usePlayerStore.getState().setQueue([item('a'), item('b')]);
    const view = render(<Player />); await flush();
    act(() => usePlayerStore.getState().next()); await flush();
    resolve(signed('a')); await flush();
    expect(view.getByTestId('audio').getAttribute('src')).toBe(signed('b').url);
  });
  it('does not revive playback after close while signing', async () => {
    let resolve!: (result: MusicAudioUrl) => void;
    vi.mocked(musicAudioUrls.get).mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
    usePlayerStore.getState().setQueue([item('a')]);
    const view = render(<Player />); await flush();
    act(() => usePlayerStore.getState().reset());
    resolve(signed('a')); await flush();
    expect(view.queryByTestId('audio')).toBeNull();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });
  it('refreshes before expiry and restores position after metadata', async () => {
    usePlayerStore.getState().setQueue([item('a')]);
    const view = render(<Player />); await flush();
    const audio = view.getByTestId('audio') as HTMLAudioElement;
    fireEvent.loadedMetadata(audio); await flush();
    usePlayerStore.getState().setCurrentTime(92);
    vi.mocked(musicAudioUrls.get).mockResolvedValue({ ...signed('a'), url: signed('a').url + '?new=1' });
    await act(async () => { await vi.advanceTimersByTimeAsync(3_540_000); });
    fireEvent.loadedMetadata(audio); await flush();
    expect(audio.currentTime).toBe(92);
    expect(audio.getAttribute('src')).toContain('?new=1');
  });
  it('does not refresh continuously while paused', async () => {
    usePlayerStore.getState().setQueue([item('a')]);
    const view = render(<Player />); await flush();
    fireEvent.loadedMetadata(view.getByTestId('audio'));
    act(() => usePlayerStore.getState().togglePlay()); await flush();
    const calls = vi.mocked(musicAudioUrls.get).mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(7_200_000); });
    expect(musicAudioUrls.get).toHaveBeenCalledTimes(calls);
  });
  it('renews once on media error then stops instead of looping', async () => {
    usePlayerStore.getState().setQueue([item('a')]);
    const view = render(<Player />); await flush();
    const audio = view.getByTestId('audio');
    fireEvent.error(audio); await flush();
    expect(musicAudioUrls.invalidate).toHaveBeenCalledTimes(1);
    fireEvent.error(audio); await flush();
    expect(musicAudioUrls.invalidate).toHaveBeenCalledTimes(1);
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    expect(view.getByText('failed')).toBeTruthy();
  });
  it('reports signing failure and allows explicit retry', async () => {
    vi.mocked(musicAudioUrls.get).mockRejectedValueOnce(new Error('offline'));
    usePlayerStore.getState().setQueue([item('a')]);
    const view = render(<Player />); await flush();
    expect(view.getByText('failed')).toBeTruthy();
    act(() => usePlayerStore.getState().togglePlay()); await flush();
    expect(view.queryByText('failed')).toBeNull();
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });
  it('requests a fresh source when retrying an element with a persistent media error', async () => {
    usePlayerStore.getState().setQueue([item('a')]);
    const view = render(<Player />); await flush();
    const audio = view.getByTestId('audio') as HTMLAudioElement;
    Object.defineProperty(audio, 'error', { configurable: true, value: { code: 4 } });
    fireEvent.error(audio); await flush();
    fireEvent.error(audio); await flush();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
    vi.mocked(musicAudioUrls.get).mockResolvedValue({ ...signed('a'), url: signed('a').url + '?retry=1' });
    act(() => usePlayerStore.getState().togglePlay()); await flush();
    expect(musicAudioUrls.invalidate).toHaveBeenCalledTimes(2);
    expect(audio.getAttribute('src')).toContain('?retry=1');
    expect(view.queryByText('failed')).toBeNull();
  });
  it('reloads a failed element even when a fresh signature returns the same URL', async () => {
    usePlayerStore.getState().setQueue([item('a')]);
    const view = render(<Player />); await flush();
    const audio = view.getByTestId('audio') as HTMLAudioElement;
    fireEvent.error(audio); await flush();
    fireEvent.error(audio); await flush();
    const loads = vi.mocked(audio.load).mock.calls.length;
    act(() => usePlayerStore.getState().togglePlay()); await flush();
    expect(musicAudioUrls.invalidate).toHaveBeenCalledTimes(2);
    expect(audio.load).toHaveBeenCalledTimes(loads + 1);
    expect(audio.getAttribute('src')).toBe(signed('a').url);
  });
  it('stops safely if signer detects a different account before auth events arrive', async () => {
    vi.mocked(musicAudioUrls.get).mockRejectedValueOnce(new AudioSessionChangedError());
    usePlayerStore.getState().setQueue([item('a')]);
    const view = render(<Player />); await flush();
    expect(view.getByText('failed')).toBeTruthy();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });
  it('handles browser play rejection without an unhandled promise', async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(new Error('NotAllowedError'));
    usePlayerStore.getState().setQueue([item('a')]);
    const view = render(<Player />); await flush();
    expect(view.getByText('failed')).toBeTruthy();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });
  it('rechecks on focus and releases source on unmount', async () => {
    usePlayerStore.getState().setQueue([item('a')]);
    const view = render(<Player />); await flush();
    const audio = view.getByTestId('audio');
    fireEvent.focus(window); await flush();
    expect(musicAudioUrls.get).toHaveBeenCalledTimes(2);
    view.unmount();
    expect(audio.getAttribute('src')).toBeNull();
  });
});
