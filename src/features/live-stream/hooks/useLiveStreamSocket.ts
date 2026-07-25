'use client';

import type { LiveStreamComment } from '../services/live-stream-comment.service';

interface UseLiveStreamSocketParams {
  streamId: string;
  userId: string;
  username: string;
  enabled?: boolean;
}

interface StreamEvents {
  onCommentCreated?: (comment: LiveStreamComment) => void;
  onReactionAdded?: (reaction: any) => void;
  onReactionRemoved?: (data: { userId: string }) => void;
  onViewerCountUpdate?: (data: { viewerCount: number }) => void;
  onViewerJoined?: (data: { userId: string; username: string }) => void;
  onViewerLeft?: (data: { userId: string }) => void;
  onStreamEnded?: () => void;
}

/**
 * Live-stream realtime channel — currently inert.
 *
 * This hook used to open a `socket.io-client` connection to
 * `${NEXT_PUBLIC_API_URL}/live-streams`. That backend no longer exists, so the
 * connection could only ever fail and none of the `events` callbacks fired.
 * Kept as a no-op with the same signature so `LiveStreamChat` renders unchanged
 * (it already treats `isConnected: false` as "no live updates"). Reimplement on
 * Supabase Realtime — see `subscribeToTable` in `@/utils/supabase/realtime`.
 */
export function useLiveStreamSocket(
  _params: UseLiveStreamSocketParams,
  _events: StreamEvents = {}
) {
  return {
    socket: null,
    isConnected: false,
    viewerCount: 0,
  };
}
