/**
 * Signaling wiring for {@link CallProvider}: the durable side of a call.
 *
 * Subscribes to UPDATEs on the one `call_sessions` row that drives lifecycle
 * (ringing → active/declined/ended/missed) over Realtime postgres_changes, and
 * hands each change to the provider's state machine. The ephemeral WebRTC
 * media handshake is the other half (see createCallEngine).
 */
import { subscribeToTable } from '@/utils/supabase/realtime';
import type { DbCallSessionRow } from '../types';

/**
 * Subscribe to lifecycle UPDATEs for `callId`. Returns the subscription so the
 * provider can store it in a ref and `unsubscribe()` on teardown.
 */
export function createLifecycleSubscription(
  callId: string,
  onLifecycle: (row: DbCallSessionRow) => void,
): ReturnType<typeof subscribeToTable> {
  return subscribeToTable<DbCallSessionRow>({
    channel: `calls:lifecycle:${callId}`,
    table: 'call_sessions',
    filter: `id=eq.${callId}`,
    events: ['UPDATE'],
    onChange: (p) => onLifecycle(p.new as DbCallSessionRow),
  });
}
