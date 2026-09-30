import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MusicAudioUrl } from '../types/music/audio-url.types';

type Session = { user: { id: string }; access_token: string } | null;
type StoreState = { user: { id: string } | null };
const mocks = vi.hoisted(() => ({
  authListener: undefined as undefined | ((event: string, session: Session) => void),
  storeListener: undefined as undefined | ((state: StoreState, previous: StoreState) => void),
  authUnsubscribe: vi.fn(), storeUnsubscribe: vi.fn(), clearPlayer: vi.fn(), sign: vi.fn(),
}));
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ auth: {
    onAuthStateChange: (callback: NonNullable<typeof mocks.authListener>) => {
      mocks.authListener = callback;
      return { data: { subscription: { unsubscribe: mocks.authUnsubscribe } } };
    },
  } }),
}));
vi.mock('@/features/auth/store/auth.store', () => ({
  useAuthStore: { subscribe: (callback: NonNullable<typeof mocks.storeListener>) => {
    mocks.storeListener = callback;
    return mocks.storeUnsubscribe;
  } },
}));
vi.mock('../components/PlayerStore', () => ({
  usePlayerStore: { getState: () => ({ reset: mocks.clearPlayer }) },
}));
vi.mock('../lib/audio-url-session', async () => {
  const { MusicAudioUrlCache } = await import('../lib/audio-url-cache');
  return { musicAudioUrls: new MusicAudioUrlCache(mocks.sign) };
});

import { AudioSessionChangedError } from '../lib/audio-url-cache';
import { musicAudioUrls } from '../lib/audio-url-session';
import { useMusicAudioSession } from './useMusicAudioSession';

function session(id = 'a', sessionId = 'session-a', refresh = 1): NonNullable<Session> {
  return { user: { id }, access_token: `test.${btoa(JSON.stringify({ session_id: sessionId, refresh }))}.test` };
}
function auth(event: string, value: Session) {
  act(() => mocks.authListener!(event, value));
}
function store(previous: string | null, next: string | null) {
  act(() => mocks.storeListener!(
    { user: next ? { id: next } : null }, { user: previous ? { id: previous } : null },
  ));
}
function signed(viewerId: string | null = 'a'): MusicAudioUrl {
  const now = Date.now();
  return { url: 'https://r2.example.test/music', serverTime: now, expiresAt: now + 3_600_000, viewerId };
}

beforeEach(() => {
  vi.resetAllMocks();
  musicAudioUrls.reset();
  vi.spyOn(musicAudioUrls, 'reset');
  mocks.sign.mockImplementation(async () => signed());
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('music audio session lifecycle', () => {
  it('waits for the initial auth result and permits public anonymous playback', async () => {
    const { result } = renderHook(useMusicAudioSession);
    expect(result.current).toBe(false);
    await expect(musicAudioUrls.get('track')).rejects.toBeInstanceOf(AudioSessionChangedError);
    auth('INITIAL_SESSION', null);
    expect(result.current).toBe(true);
    expect(musicAudioUrls.reset).toHaveBeenCalledExactlyOnceWith(null);
    expect(mocks.clearPlayer).not.toHaveBeenCalled();
    mocks.sign.mockResolvedValue(signed(null));
    await expect(musicAudioUrls.get('track')).resolves.toMatchObject({ viewerId: null });
  });

  it('keeps the known B session ready when the auth event precedes the A -> B store update', async () => {
    const { result } = renderHook(useMusicAudioSession);
    auth('INITIAL_SESSION', session());
    auth('SIGNED_IN', session('b', 'session-b'));
    store('a', 'b');
    expect(result.current).toBe(true);
    expect(musicAudioUrls.reset).toHaveBeenCalledTimes(2);
    expect(musicAudioUrls.reset).toHaveBeenLastCalledWith('b');
    expect(mocks.clearPlayer).toHaveBeenCalledOnce();
    mocks.sign.mockResolvedValue(signed('b'));
    await expect(musicAudioUrls.get('track')).resolves.toMatchObject({ viewerId: 'b' });
  });

  it.each(['a', null])('waits safely when the %s -> B store update precedes auth', async (previous) => {
    const { result } = renderHook(useMusicAudioSession);
    auth('INITIAL_SESSION', previous ? session(previous) : null);
    store(previous, 'b');
    expect(result.current).toBe(false);
    expect(musicAudioUrls.reset).toHaveBeenLastCalledWith(undefined);
    await expect(musicAudioUrls.get('track')).rejects.toBeInstanceOf(AudioSessionChangedError);
    auth('SIGNED_IN', session('b', 'session-b'));
    expect(result.current).toBe(true);
    expect(musicAudioUrls.reset).toHaveBeenLastCalledWith('b');
    expect(mocks.clearPlayer).toHaveBeenCalledOnce();
  });

  it('clears URLs and playback on SIGNED_OUT without duplicating the store cleanup', async () => {
    const { result } = renderHook(useMusicAudioSession);
    auth('INITIAL_SESSION', session());
    await musicAudioUrls.get('track');
    auth('SIGNED_OUT', null);
    store('a', null);
    expect(result.current).toBe(true);
    expect(musicAudioUrls.remaining('track')).toBe(0);
    expect(musicAudioUrls.reset).toHaveBeenCalledTimes(2);
    expect(musicAudioUrls.reset).toHaveBeenLastCalledWith(null);
    expect(mocks.clearPlayer).toHaveBeenCalledOnce();
  });

  it('clears URLs and playback on local logout even when Supabase never emits SIGNED_OUT', async () => {
    const { result } = renderHook(useMusicAudioSession);
    auth('INITIAL_SESSION', session());
    await musicAudioUrls.get('track');
    store('a', null);
    expect(result.current).toBe(true);
    expect(musicAudioUrls.remaining('track')).toBe(0);
    expect(musicAudioUrls.reset).toHaveBeenLastCalledWith(null);
    expect(mocks.clearPlayer).toHaveBeenCalledOnce();
  });

  it('invalidates cached and pending URLs for a new session_id of the same user', async () => {
    renderHook(useMusicAudioSession);
    auth('INITIAL_SESSION', session());
    await musicAudioUrls.get('cached');
    let resolve!: (value: MusicAudioUrl) => void;
    mocks.sign.mockReturnValueOnce(new Promise<MusicAudioUrl>((done) => { resolve = done; }));
    const pending = musicAudioUrls.get('pending');
    const rejected = expect(pending).rejects.toBeInstanceOf(AudioSessionChangedError);
    auth('SIGNED_IN', session('a', 'new-session'));
    resolve(signed());
    await rejected;
    expect(musicAudioUrls.remaining('cached')).toBe(0);
    expect(musicAudioUrls.remaining('pending')).toBe(0);
    expect(mocks.clearPlayer).toHaveBeenCalledOnce();
  });

  it('preserves URLs across token refreshes, repeated sign-in events, and profile updates for the same session', async () => {
    const { result } = renderHook(useMusicAudioSession);
    auth('INITIAL_SESSION', session());
    await musicAudioUrls.get('track');
    auth('TOKEN_REFRESHED', session('a', 'session-a', 2));
    auth('SIGNED_IN', session('a', 'session-a', 2));
    store('a', 'a');
    expect(result.current).toBe(true);
    await musicAudioUrls.get('track');
    expect(mocks.sign).toHaveBeenCalledOnce();
    expect(musicAudioUrls.reset).toHaveBeenCalledOnce();
    expect(mocks.clearPlayer).not.toHaveBeenCalled();
  });

  it('unsubscribes, clears URLs/player, and rejects pending results on unmount', async () => {
    const { unmount } = renderHook(useMusicAudioSession);
    auth('INITIAL_SESSION', session());
    await musicAudioUrls.get('cached');
    let resolve!: (value: MusicAudioUrl) => void;
    mocks.sign.mockReturnValueOnce(new Promise<MusicAudioUrl>((done) => { resolve = done; }));
    const pending = musicAudioUrls.get('pending');
    const rejected = expect(pending).rejects.toBeInstanceOf(AudioSessionChangedError);
    unmount();
    expect(mocks.authUnsubscribe).toHaveBeenCalledOnce();
    expect(mocks.storeUnsubscribe).toHaveBeenCalledOnce();
    expect(musicAudioUrls.reset).toHaveBeenLastCalledWith();
    expect(mocks.clearPlayer).toHaveBeenCalledOnce();
    expect(musicAudioUrls.remaining('cached')).toBe(0);
    resolve(signed());
    await rejected;
    auth('SIGNED_IN', session('b', 'session-b'));
    store('a', 'b');
    expect(musicAudioUrls.reset).toHaveBeenCalledTimes(2);
    expect(mocks.clearPlayer).toHaveBeenCalledOnce();
    await expect(musicAudioUrls.get('track')).rejects.toBeInstanceOf(AudioSessionChangedError);
  });
});
