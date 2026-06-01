import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from './client';

/**
 * Lightweight realtime adapter so the app talks to "subscribe to table changes"
 * and "broadcast ephemeral events" without reaching into the Supabase SDK
 * directly everywhere. Keeps the migration-from-Supabase surface area small.
 */

let browserClient: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!browserClient) browserClient = createClient();
  return browserClient;
}

export interface TableChangePayload<T = Record<string, unknown>> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  new: T | Record<string, never>;
  old: T | Record<string, never>;
}

export type TableChangeHandler<T = Record<string, unknown>> = (payload: TableChangePayload<T>) => void;

export interface SubscribeToTableOptions<T> {
  /** Table name under `public` schema. */
  table: string;
  /** Optional PostgREST filter, e.g. `conversation_id=eq.<uuid>`. */
  filter?: string;
  /** Which events to listen for. Defaults to all. */
  events?: Array<'INSERT' | 'UPDATE' | 'DELETE'>;
  /** Unique channel name. Use distinct names per subscription. */
  channel: string;
  onChange: TableChangeHandler<T>;
}

/**
 * Subscribe to row-level changes on a public-schema table. Replaces the
 * Supabase pattern of `realtime.publish(channel, event, payload)` +
 * `realtime.on(event)` — senders just INSERT/UPDATE the row and every
 * subscriber gets a payload for free.
 */
export function subscribeToTable<T = Record<string, unknown>>(
  opts: SubscribeToTableOptions<T>,
): RealtimeChannel {
  const client = getClient();
  const events = opts.events ?? ['INSERT', 'UPDATE', 'DELETE'];
  // Append a nonce so recent @supabase/realtime-js doesn't return an
  // already-joined channel for the same topic (which would make `.on(
  // 'postgres_changes', ...)` throw after Strict Mode / HMR re-runs).
  const nonce = Math.random().toString(36).slice(2, 8);
  const channel = client.channel(`${opts.channel}:${nonce}`);

  for (const event of events) {
    channel.on(
      'postgres_changes' as never,
      {
        event,
        schema: 'public',
        table: opts.table,
        ...(opts.filter ? { filter: opts.filter } : {}),
      },
      (payload: unknown) => opts.onChange(payload as TableChangePayload<T>),
    );
  }

  channel.subscribe();
  return channel;
}

/**
 * Unsubscribe and remove a channel. Safe to call multiple times.
 */
export function unsubscribe(channel: RealtimeChannel | null | undefined): void {
  if (!channel) return;
  try {
    void getClient().removeChannel(channel);
  } catch {
    // ignore
  }
}

export interface SubscribeToBroadcastOptions<T> {
  channel: string;
  event: string;
  onMessage: (payload: T) => void;
}

/**
 * Subscribe to ephemeral broadcast messages (no DB). Use this for typing
 * indicators, presence, cursor positions — anything that shouldn't hit
 * Postgres.
 */
export function subscribeToBroadcast<T = Record<string, unknown>>(
  opts: SubscribeToBroadcastOptions<T>,
): RealtimeChannel {
  const client = getClient();
  const channel = client.channel(opts.channel, { config: { broadcast: { self: false } } });
  channel.on('broadcast', { event: opts.event }, (msg: { payload: unknown }) =>
    opts.onMessage(msg.payload as T),
  );
  channel.subscribe();
  return channel;
}

export interface BroadcastChannelHandle {
  channel: RealtimeChannel;
  /** Resolves once the channel has actually joined (SUBSCRIBED). */
  ready: Promise<void>;
  /** Send a broadcast event; waits for the join so early sends aren't dropped. */
  send: (event: string, payload: Record<string, unknown>) => Promise<void>;
  /** Tear down the channel. */
  close: () => void;
}

/**
 * Open a single broadcast channel used for BOTH receiving and sending (unlike
 * `subscribeToBroadcast` + `publishBroadcast`, which use separate channels and
 * a fresh channel per publish). Needed for WebRTC signaling where one peer both
 * listens for and trickles many SDP/ICE messages over the same `call:<id>`
 * channel, and must not send before the join completes.
 */
export function openBroadcastChannel(
  channelName: string,
  onMessage: (event: string, payload: unknown) => void,
  events: string[],
): BroadcastChannelHandle {
  const client = getClient();
  const channel = client.channel(channelName, {
    config: { broadcast: { self: false, ack: false } },
  });
  for (const ev of events) {
    channel.on('broadcast', { event: ev }, (msg: { payload: unknown }) =>
      onMessage(ev, msg.payload),
    );
  }

  let resolveReady!: () => void;
  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });
  channel.subscribe((status: string) => {
    if (status === 'SUBSCRIBED') resolveReady();
  });

  const send = async (event: string, payload: Record<string, unknown>) => {
    await ready;
    await channel.send({ type: 'broadcast', event, payload });
  };
  const close = () => {
    try {
      void client.removeChannel(channel);
    } catch {
      // ignore
    }
  };

  return { channel, ready, send, close };
}

/**
 * Publish an ephemeral broadcast message to a channel.
 */
export async function publishBroadcast<T = Record<string, unknown>>(
  channelName: string,
  event: string,
  payload: T,
): Promise<void> {
  const client = getClient();
  const channel = client.channel(channelName);
  await channel.subscribe();
  await channel.send({ type: 'broadcast', event, payload: payload as Record<string, unknown> });
}

/**
 * Compatibility shim for call sites that previously used Supabase's
 * `ensureRealtimeConnected`. Supabase's realtime connects lazily per
 * channel, so there's nothing to do here — we keep the function so
 * callers don't need to branch on which backend they're talking to.
 */
export async function ensureRealtimeConnected(): Promise<boolean> {
  return true;
}

/**
 * Compatibility shim. Supabase manages per-channel lifecycle; a global
 * "disconnect everything" call is disconnectAllChannels on the client.
 */
export async function disconnectRealtime(): Promise<void> {
  try {
    const client = getClient();
    client.removeAllChannels();
  } catch {
    // ignore
  }
}

export function resetRealtimeFailure(): void {
  // No-op on Supabase — kept for API parity with the Supabase adapter.
}
