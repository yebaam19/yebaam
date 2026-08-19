import type { RealtimeChannel } from '@supabase/supabase-js';
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime';
import { useFriendshipsStore } from './friendships.store';

/**
 * Realtime refresh trigger for the friendships store.
 *
 * `friendships` itself is NOT in the `supabase_realtime` publication (see
 * AGENTS.md → "Realtime"), so we can't listen to it directly. `notifications`
 * IS published, and both friend-request events that matter to a viewer land
 * there as rows addressed to them: `friend_request` (someone sent me one) and
 * `friend_accept` (someone accepted mine). Any such INSERT re-reads friends +
 * pending/sent through the store actions, whose in-flight guards dedupe.
 *
 * Reject / cancel / unfriend by the OTHER party produce no notification row and
 * therefore don't live-update; they reconcile on the next mount/refetch. To make
 * them live, add the table to the publication
 * (`ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;`) and
 * subscribe here to `friendships` filtered on `requester_id` / `recipient_id`.
 *
 * Exactly ONE channel exists per browser tab regardless of how many components
 * mount `useFriendships()` (RightSidebar rail, FriendRequestsCard, every
 * /feed/friends tab…): the channel is module-scoped and refcounted — the first
 * acquirer opens it, the last release closes it.
 */

const FRIEND_NOTIFICATION_TYPES = new Set(['friend_request', 'friend_accept']);

type NotificationRow = { type?: string; recipient_id?: string };

let channel: RealtimeChannel | null = null;
let channelUserId: string | null = null;
let refCount = 0;

function teardown(): void {
  unsubscribe(channel);
  channel = null;
  channelUserId = null;
  refCount = 0;
}

function refreshFromStore(): void {
  const { fetchFriends, fetchPendingRequests, fetchSentRequests } = useFriendshipsStore.getState();
  void fetchFriends();
  // pending + sent share one round-trip (see getAllPendingRequests guard).
  void fetchPendingRequests();
  void fetchSentRequests();
}

/**
 * Ensure the singleton subscription for `userId` is open and take a reference
 * on it. Returns a release function (idempotent) to call on unmount.
 */
export function acquireFriendshipsRealtime(userId: string): () => void {
  // User switched without every holder releasing first — start clean.
  if (channel && channelUserId !== userId) teardown();

  refCount += 1;
  if (!channel) {
    channelUserId = userId;
    channel = subscribeToTable<NotificationRow>({
      channel: `friendships:notifications:${userId}`,
      table: 'notifications',
      filter: `recipient_id=eq.${userId}`,
      events: ['INSERT'],
      onChange: (payload) => {
        const type = (payload.new as NotificationRow).type;
        if (type && FRIEND_NOTIFICATION_TYPES.has(type)) refreshFromStore();
      },
    });
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    refCount -= 1;
    if (refCount <= 0) teardown();
  };
}
