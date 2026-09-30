'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { usePlayerStore } from '../components/PlayerStore';
import { musicAudioUrls } from '../lib/audio-url-session';

type AudioSession = { user: { id: string }; access_token: string } | null;

/** Cache partition only. This does not authorize playback; RLS does that. */
function sessionKey(token: string): string {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(payload));
    return typeof claims.session_id === 'string' ? claims.session_id : token;
  } catch { return token; }
}

export function useMusicAudioSession() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let context: string | undefined;
    let viewerId: string | null | undefined;
    let active = true;
    const clearPlayer = () => usePlayerStore.getState().reset();
    const { data: { subscription } } = createClient().auth.onAuthStateChange((event: string, session: AudioSession) => {
      if (!active) return;
      const nextContext = session ? `${session.user.id}:${sessionKey(session.access_token)}` : 'guest';
      if (context !== nextContext || event === 'SIGNED_OUT') {
        viewerId = session?.user.id ?? null;
        musicAudioUrls.reset(viewerId);
        if (context !== undefined) clearPlayer();
        context = nextContext;
      }
      setReady(true);
    });
    // Local logout cleanup still runs if a failed remote sign-out never emits
    // SIGNED_OUT. It also protects user switches handled by the app's store.
    const unsubscribe = useAuthStore.subscribe((state, previous) => {
      const nextViewerId = state.user?.id ?? null;
      // Supabase can announce B before the app finishes loading B's profile.
      // That later A -> B store update must not erase the known B session.
      if (active && previous.user?.id !== state.user?.id && viewerId !== nextViewerId) {
        viewerId = state.user ? undefined : null;
        musicAudioUrls.reset(viewerId);
        clearPlayer();
        context = state.user ? undefined : 'guest';
        setReady(!state.user);
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
      unsubscribe();
      musicAudioUrls.reset();
      clearPlayer();
    };
  }, []);
  return ready;
}
