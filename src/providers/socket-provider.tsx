'use client';

import type { LegacySocket } from '@/socket/socket-client';

/**
 * Legacy socket.io context shim.
 *
 * `SocketProvider` used to mount in the root layout and connect six socket.io
 * namespaces. That backend is gone — realtime now runs on Supabase
 * (`subscribeToTable` in `@/utils/supabase/realtime`) — and the provider was
 * gated behind `NEXT_PUBLIC_REALTIME_ENABLED`, which is set in no environment.
 * Every socket it handed out was therefore already `null`.
 *
 * The provider and its `socket.io-client` dependency are removed; `useSocket()`
 * survives as a constant no-op so the remaining consumers keep compiling and
 * keep short-circuiting on their existing null guards. Delete it once those
 * consumers are migrated to Supabase Realtime.
 */

type ConnectionState = 'connected' | 'disconnected' | 'reconnecting' | 'error';

interface SocketContextType {
  usersSocket: LegacySocket | null;
  postsSocket: LegacySocket | null;
  storiesSocket: LegacySocket | null;
  friendshipsSocket: LegacySocket | null;
  notificationsSocket: LegacySocket | null;
  chatSocket: LegacySocket | null;
  isConnected: boolean;
  isUsersConnected: boolean;
  isPostsConnected: boolean;
  isStoriesConnected: boolean;
  isFriendshipsConnected: boolean;
  isNotificationsConnected: boolean;
  isChatConnected: boolean;
  connectionState: ConnectionState;
  reconnect: () => void;
}

const DISCONNECTED: SocketContextType = {
  usersSocket: null,
  postsSocket: null,
  storiesSocket: null,
  friendshipsSocket: null,
  notificationsSocket: null,
  chatSocket: null,
  isConnected: false,
  isUsersConnected: false,
  isPostsConnected: false,
  isStoriesConnected: false,
  isFriendshipsConnected: false,
  isNotificationsConnected: false,
  isChatConnected: false,
  connectionState: 'disconnected',
  reconnect: () => {},
};

export function useSocket(): SocketContextType {
  return DISCONNECTED;
}
