'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase/client';
import { anonymousChatService } from '../services/anonymous-chat.service';
import {
  ANON_EVENT,
  anonChannelName,
  type AnonMediaPayload,
  type AnonMessage,
  type AnonSession,
} from '../types';

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

export type AnonEndReason = 'peer-left' | 'closed' | 'error';

interface UseAnonConversationOptions {
  session: AnonSession;
  /** Fired once when the session ends so the shell can drop the bubble / redirect. */
  onEnded?: (reason: AnonEndReason) => void;
}

interface UseAnonConversationReturn {
  messages: AnonMessage[];
  isPeerTyping: boolean;
  isConnected: boolean;
  peerPresent: boolean;
  sendText: (content: string) => void;
  sendMedia: (media: AnonMediaPayload) => void;
  notifyTyping: (typing: boolean) => void;
  /** Leave gracefully — tells the peer, tears down, deletes the invite row. */
  leave: () => void;
}

/**
 * Owns one Supabase Realtime channel (`anon:<channelKey>`) carrying BOTH
 * broadcast (message transport) and presence (liveness). Messages live only in
 * component state — refresh/close/disconnect erases everything, satisfying the
 * "no record / deletes when the chat closes" spec.
 *
 * Teardown is driven by **presence**, not just a graceful `bye`, so a tab-kill
 * or refresh on one side still tears down the other ("deletes when chat closes"
 * must hold even on a crash).
 */
export function useAnonymousConversation({
  session,
  onEnded,
}: UseAnonConversationOptions): UseAnonConversationReturn {
  const { channelKey, myNick, inviteId, role } = session;

  const [messages, setMessages] = useState<AnonMessage[]>([]);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [peerPresent, setPeerPresent] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const clientIdRef = useRef<string>(newId());
  const endedRef = useRef(false);
  const hadPeerRef = useRef(false);
  const inviteClosedRef = useRef(false);
  /** Cloudflare ids of images THIS client uploaded — deleted on teardown. */
  const sentMediaRef = useRef<string[]>([]);
  const typingOffTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep the latest onEnded without re-subscribing the channel on every render.
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const end = useCallback((reason: AnonEndReason) => {
    if (endedRef.current) return;
    endedRef.current = true;
    onEndedRef.current?.(reason);
  }, []);

  /** Delete the transient invite row once — safe after both sides handshook. */
  const closeInviteOnce = useCallback(() => {
    if (inviteClosedRef.current) return;
    inviteClosedRef.current = true;
    void anonymousChatService.closeInvite(inviteId);
  }, [inviteId]);

  useEffect(() => {
    endedRef.current = false;
    hadPeerRef.current = false;
    const myClientId = clientIdRef.current;

    const channel = supabase.channel(anonChannelName(channelKey), {
      config: {
        broadcast: { self: false },
        presence: { key: myClientId },
      },
    });
    channelRef.current = channel;

    const refreshPresence = () => {
      const state = channel.presenceState();
      const present = Object.keys(state).some((key) => key !== myClientId);
      if (present) hadPeerRef.current = true;
      setPeerPresent(present);
      // Peer was here and is now gone ⇒ the chat is over on this side too.
      if (hadPeerRef.current && !present) end('peer-left');
    };

    channel
      .on('broadcast', { event: ANON_EVENT.msg }, ({ payload }: { payload: { nick: string; content: string; id?: string } }) => {
        const p = payload;
        setMessages((prev) => [
          ...prev,
          {
            id: p.id ?? newId(),
            senderNick: p.nick,
            isOwn: false,
            content: p.content,
            createdAt: Date.now(),
          },
        ]);
      })
      .on('broadcast', { event: ANON_EVENT.media }, ({ payload }: { payload: { nick: string; media: AnonMediaPayload; id?: string } }) => {
        const p = payload;
        setMessages((prev) => [
          ...prev,
          { id: p.id ?? newId(), senderNick: p.nick, isOwn: false, media: p.media, createdAt: Date.now() },
        ]);
      })
      .on('broadcast', { event: ANON_EVENT.typing }, ({ payload }: { payload: { typing: boolean } }) => {
        const typing = payload.typing;
        setIsPeerTyping(typing);
        if (typingOffTimer.current) clearTimeout(typingOffTimer.current);
        if (typing) {
          typingOffTimer.current = setTimeout(() => setIsPeerTyping(false), 3000);
        }
      })
      .on('broadcast', { event: ANON_EVENT.ready }, () => {
        // Peer is in and holds both nicks + the channel key. The requester owns
        // invite-row cleanup so we don't double-delete.
        if (role === 'requester') closeInviteOnce();
      })
      .on('broadcast', { event: ANON_EVENT.bye }, () => end('peer-left'))
      .on('presence', { event: 'sync' }, refreshPresence)
      .on('presence', { event: 'join' }, refreshPresence)
      .on('presence', { event: 'leave' }, refreshPresence)
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          void channel.track({ nick: myNick });
          void channel.send({ type: 'broadcast', event: ANON_EVENT.ready, payload: { nick: myNick } });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsConnected(false);
        }
      });

    // A refresh/navigation should look like a clean leave to the peer; presence
    // also drops on socket close, so the peer tears down either way.
    const onBeforeUnload = () => {
      try {
        void channel.send({ type: 'broadcast', event: ANON_EVENT.bye, payload: { nick: myNick } });
        void channel.untrack();
      } catch {
        /* noop */
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (typingOffTimer.current) clearTimeout(typingOffTimer.current);
      channelRef.current = null;
      // Verified ordering matters: presence-leave only propagates promptly when
      // untrack() flushes BEFORE the socket closes. Without sequencing, removeChannel
      // can tear down first and the peer never sees the leave (≈1.25s when sequenced
      // vs. not firing otherwise). React cleanup can't be async, so fire-and-forget
      // the sequence: bye (graceful) → untrack (prompt leave) → removeChannel.
      void (async () => {
        try {
          await channel.send({ type: 'broadcast', event: ANON_EVENT.bye, payload: { nick: myNick } });
        } catch {
          /* noop */
        }
        try {
          await channel.untrack();
        } catch {
          /* noop */
        }
        try {
          await supabase.removeChannel(channel);
        } catch {
          /* noop */
        }
        // Hard-delete any images this client uploaded, so no media outlives the
        // ephemeral chat (signed URLs also expire on their own after 5 min).
        for (const cfId of sentMediaRef.current) {
          void fetch('/api/anon-chat/media-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cfId }),
          }).catch(() => {});
        }
        sentMediaRef.current = [];
      })();
      setMessages([]);
      closeInviteOnce();
    };
  }, [channelKey, myNick, role, end, closeInviteOnce]);

  const sendText = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      const channel = channelRef.current;
      if (!trimmed || !channel) return;
      const id = newId();
      setMessages((prev) => [
        ...prev,
        { id, senderNick: myNick, isOwn: true, content: trimmed, createdAt: Date.now() },
      ]);
      void channel.send({ type: 'broadcast', event: ANON_EVENT.msg, payload: { nick: myNick, content: trimmed, id } });
    },
    [myNick],
  );

  const sendMedia = useCallback(
    (media: AnonMediaPayload) => {
      const channel = channelRef.current;
      if (!channel) return;
      const id = newId();
      if (media.cfId) sentMediaRef.current.push(media.cfId);
      setMessages((prev) => [...prev, { id, senderNick: myNick, isOwn: true, media, createdAt: Date.now() }]);
      void channel.send({ type: 'broadcast', event: ANON_EVENT.media, payload: { nick: myNick, media, id } });
    },
    [myNick],
  );

  const notifyTyping = useCallback(
    (typing: boolean) => {
      const channel = channelRef.current;
      if (!channel) return;
      void channel.send({ type: 'broadcast', event: ANON_EVENT.typing, payload: { typing } });
    },
    [],
  );

  const leave = useCallback(() => {
    end('closed');
  }, [end]);

  return { messages, isPeerTyping, isConnected, peerPresent, sendText, sendMedia, notifyTyping, leave };
}
