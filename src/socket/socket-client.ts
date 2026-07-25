/**
 * Legacy socket.io compatibility shim.
 *
 * The socket.io backend this module used to talk to no longer exists — realtime
 * is served by Supabase (`subscribeToTable` in `@/utils/supabase/realtime`).
 * The real client was gated behind `NEXT_PUBLIC_REALTIME_ENABLED`, which is set
 * in no environment, so every call site was already a no-op at runtime while
 * still pulling `socket.io-client` into the global bundle.
 *
 * This file keeps the old export surface alive (typed, no-op) so the remaining
 * call sites compile untouched. Delete it once those call sites are migrated.
 */

/** Structural stand-in for `socket.io-client`'s `Socket`. */
export interface LegacySocket {
  connected: boolean;
  disconnected: boolean;
  id?: string;
  on(event: string, listener: (...args: any[]) => void): LegacySocket;
  once(event: string, listener: (...args: any[]) => void): LegacySocket;
  off(event?: string, listener?: (...args: any[]) => void): LegacySocket;
  emit(event: string, ...args: any[]): LegacySocket;
  connect(): LegacySocket;
  disconnect(): LegacySocket;
  removeAllListeners(event?: string): LegacySocket;
}

export const socketManager = {
  getSocket(_namespace: string): LegacySocket | null {
    return null;
  },
  disconnectAll(): void {},
  forceReinitialize(): void {},
};
