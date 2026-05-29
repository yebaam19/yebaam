'use client';

import { useEffect } from 'react';
import { subscribeToBroadcast, unsubscribe } from '@/utils/supabase/realtime';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { anonymousChatService } from '../services/anonymous-chat.service';
import { useAnonChatStore } from '../store/anon-chat.store';
import { anonUserPingTopic } from '../types';

/**
 * Global, mount-once subscriber that surfaces incoming anonymous-chat invites.
 *
 * Delivery is "ping + pull": a contentless Broadcast ping on the user's own
 * topic nudges this hook to PULL the actual invite (nick-only) via an RLS'd
 * RPC. Sensitive data (channel key, nicks) never travels over Broadcast, and
 * the requester's identity is never exposed. A catch-up fetch on mount covers
 * invites that arrived while offline.
 *
 * Mount exactly once (next to the bubble tray), not per chat surface.
 */
export function useIncomingAnonInvites(): void {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const setIncomingInvite = useAnonChatStore((s) => s.setIncomingInvite);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const refetch = async () => {
      const pending = await anonymousChatService.fetchPendingInvites();
      if (cancelled || pending.length === 0) return;
      // Surface the most recent unanswered invite.
      const latest = pending.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
      setIncomingInvite(latest);
    };

    // Catch-up for invites received while offline.
    void refetch();

    const channel = subscribeToBroadcast({
      channel: anonUserPingTopic(userId),
      event: 'ping',
      onMessage: () => void refetch(),
    });

    return () => {
      cancelled = true;
      unsubscribe(channel);
    };
  }, [userId, setIncomingInvite]);
}
