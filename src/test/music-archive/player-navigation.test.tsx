import { act, fireEvent, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import Layout from '@/app/(app)/layout';
import { usePlayerStore } from '@/features/music-archive/components/PlayerStore';
import { musicAudioUrls } from '@/features/music-archive/lib/audio-url-session';

const route = vi.hoisted(() => ({ pathname: '/musica/albumes/first' }));
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@/app/(app)/application-layout', async () => {
  const { ApplicationLayoutClient } = await import('@/app/(app)/application-layout-client');
  return { ApplicationLayout: ({ children }: { children: ReactNode }) => (
    <ApplicationLayoutClient user={{ id: 'listener', username: 'listener', displayName: 'Listener' }}>
      {children}
    </ApplicationLayoutClient>
  ) };
});
vi.mock('@/components/Header/Header', () => ({ default: () => null }));
vi.mock('@/components/Header/SocialHeader', () => ({ default: () => null }));
vi.mock('@/components/aside', () => ({ default: { Provider: ({ children }: { children: ReactNode }) => children } }));
vi.mock('@/features/auth/context/current-user.context', () => ({ CurrentUserProvider: ({ children }: { children: ReactNode }) => children }));
vi.mock('@/features/chat/context/chat-notification.context', () => ({ ChatNotificationProvider: ({ children }: { children: ReactNode }) => children }));
vi.mock('@/features/chat/calls/CallProvider', () => ({ CallProvider: ({ children }: { children: ReactNode }) => children }));
vi.mock('@/components/chat/ChatBubbleTray', () => ({ default: () => null }));
vi.mock('@/features/anonymous-chat/components/AnonymousChatRoot', () => ({ default: () => null }));
vi.mock('@/features/profile/components/media/UploadProgress', () => ({ default: () => null }));
vi.mock('@/features/notification/hooks/useNotificationSync', () => ({ useNotificationSync: () => {} }));
vi.mock('@/features/presence/hooks/usePresenceSync', () => ({ usePresenceSync: () => {} }));
vi.mock('@/features/music-archive/components/media/MusicMediaLightbox', () => ({ MusicMediaLightbox: () => null }));
vi.mock('@/features/music-archive/components/media/MusicMediaMiniPlayer', () => ({ MusicMediaMiniPlayer: () => null }));
vi.mock('@/features/music-archive/actions/playback.actions', () => ({ incrementPlayCount: vi.fn() }));
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({ auth: {
    onAuthStateChange: (callback: (event: string, session: null) => void) => {
      callback('INITIAL_SESSION', null);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    },
  } }),
}));
vi.mock('@/features/auth/store/auth.store', () => ({ useAuthStore: { subscribe: () => () => {} } }));
vi.mock('@/features/music-archive/lib/audio-url-session', () => ({ musicAudioUrls: {
  reset: vi.fn(), invalidate: vi.fn(), remaining: () => 3_600_000,
  get: vi.fn(async (id: string) => ({ url: `https://r2.example.test/${id}` })),
} }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  usePlayerStore.getState().reset();
  route.pathname = '/musica/albumes/first';
});

it('keeps the same audio, queue and position while leaving the album, searching and changing app sections', async () => {
  const view = render(<Layout><div>Album</div></Layout>);
  await act(async () => usePlayerStore.getState().setQueue([{
    trackId: 'first', title: 'First song', artistName: 'Artist', albumSlug: 'first',
    artistSlug: 'artist', coverCfId: null, durationSeconds: 240,
  }]));
  const audio = view.container.querySelector('audio')!;
  audio.currentTime = 12;
  fireEvent.timeUpdate(audio);
  const pauses = vi.mocked(audio.pause).mock.calls.length;
  const loads = vi.mocked(audio.load).mock.calls.length;

  for (const pathname of ['/musica', '/musica/buscar', '/musica/albumes/second', '/feed', '/chat', '/messages', '/musica']) {
    route.pathname = pathname;
    await act(async () => view.rerender(<Layout><div>{pathname}</div></Layout>));
    expect(view.container.querySelector('audio'), pathname).toBe(audio);
    expect(audio.getAttribute('src'), pathname).toBe('https://r2.example.test/first');
    expect(audio.currentTime, pathname).toBe(12);
    expect(usePlayerStore.getState().queue[0]?.trackId, pathname).toBe('first');
    expect(usePlayerStore.getState().isPlaying, pathname).toBe(true);
    expect(audio.pause, pathname).toHaveBeenCalledTimes(pauses);
    expect(audio.load, pathname).toHaveBeenCalledTimes(loads);
  }
  expect(musicAudioUrls.get).toHaveBeenCalledOnce();
  fireEvent.click(view.getByRole('button', { name: 'closeAria' }));
  expect(view.container.querySelector('audio')).toBeNull();
  expect(audio.getAttribute('src')).toBeNull();
  expect(usePlayerStore.getState().isPlaying).toBe(false);
});
