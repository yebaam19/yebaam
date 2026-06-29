import { supabase } from '@/utils/supabase/client';
import { getCurrentUserId } from '@/utils/supabase/current-user';
import { FriendRequestBlockedError, blockMessageFor } from './friendships.errors';
import {
  type DbFriendship,
  hydrateProfiles,
  profileToShortDto,
  rowToRequest,
} from './_shared';
import type {
  AllPendingRequestsResponse,
  FriendRequest,
  FriendRequestBlockReason,
  FriendRequestQuota,
  PendingRequestsResponse,
  SendFriendRequestDto,
} from './friendships.types';

type SendFriendRequestRpcResult =
  | {
      ok: true;
      friendship_id: string;
      counts: { hour: number; day: number; week: number };
      limits: { hour: number; day: number; week: number };
      is_new_account: boolean;
    }
  | {
      ok: false;
      reason: FriendRequestBlockReason;
      unfreeze_at?: string;
      counts?: { hour: number; day: number; week: number };
      limits?: { hour: number; day: number; week: number };
      limit?: number;
      freeze_reason?: string;
    };

async function sendFriendRequest(data: SendFriendRequestDto): Promise<FriendRequest> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data: rpcData, error } = await supabase.rpc('send_friend_request', {
    p_addressee: data.addresseeId,
    p_message: data.message ?? null,
  });

  if (error) {
    throw new Error(error.message || 'Error al enviar solicitud de amistad');
  }

  const result = rpcData as unknown as SendFriendRequestRpcResult | null;
  if (!result) {
    throw new Error('Error al enviar solicitud de amistad');
  }

  if (!result.ok) {
    throw new FriendRequestBlockedError(
      result.reason,
      blockMessageFor(result.reason, result.unfreeze_at),
      {
        unfreezeAt: result.unfreeze_at,
        counts: result.counts,
        limits: result.limits,
        freezeReason: result.freeze_reason,
      },
    );
  }

  // Synthesize a FriendRequest payload — the RPC returns only the id and quota,
  // so we build the rest from inputs (sender id, addressee, current timestamp).
  return {
    id: result.friendship_id,
    requesterId: userId,
    addresseeId: data.addresseeId,
    status: 'pending',
    sentAt: new Date().toISOString(),
  };
}

async function getFriendRequestQuota(): Promise<FriendRequestQuota | null> {
  const { data, error } = await supabase.rpc('friend_request_quota_status');
  if (error || !data) return null;

  const raw = data as {
    ok: boolean;
    counts?: { hour: number; day: number; week: number };
    limits?: { hour: number; day: number; week: number };
    is_new_account?: boolean;
    freeze?: { until: string; reason: string } | null;
  };
  if (!raw.ok || !raw.counts || !raw.limits) return null;

  return {
    counts: raw.counts,
    limits: raw.limits,
    isNewAccount: raw.is_new_account ?? false,
    freeze: raw.freeze ?? null,
  };
}

async function acceptFriendRequest(requestId: string): Promise<FriendRequest> {
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', requestId)
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message || 'Error al aceptar solicitud');
  const friendship = data as DbFriendship;

  await supabase.from('notifications').insert([
    {
      type: 'friend_accept',
      recipient_id: friendship.requester_id,
      actor_id: friendship.recipient_id,
      related_id: friendship.id,
      message: 'accepted your friend request',
    },
  ]);

  return rowToRequest(friendship);
}

async function rejectFriendRequest(requestId: string): Promise<FriendRequest> {
  const { data, error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', requestId)
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message || 'Error al rechazar solicitud');
  return rowToRequest(data as DbFriendship);
}

async function cancelFriendRequest(requestId: string): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', requestId);
  if (error) throw new Error(error.message || 'Error al cancelar solicitud');
  return { success: true, message: 'Solicitud cancelada' };
}

async function getRequesterProfile(friendshipId: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('id', friendshipId)
    .single();
  if (error || !data) throw new Error(error?.message || 'Friendship not found');
  const row = data as DbFriendship;

  const isRequester = row.requester_id === userId;
  const otherUserId = isRequester ? row.recipient_id : row.requester_id;
  const profiles = await hydrateProfiles([otherUserId]);

  return {
    friendshipId: row.id,
    requesterId: row.requester_id,
    addresseeId: row.recipient_id,
    sentAt: row.created_at,
    status: row.status,
    profile: profileToShortDto(profiles.get(otherUserId), otherUserId) as {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    },
    profileType: (isRequester ? 'addressee' : 'requester') as 'requester' | 'addressee',
  };
}

// getPendingRequests and getSentRequests are different *views* of the same
// received+sent payload, but the store calls them as two separate actions and
// useFriendships() fires both on mount (plus a realtime-reconnect refetch).
// Without this guard each would run its own 2 friendships queries + a
// hydrateProfiles — doubling the friendships/profiles traffic on /feed for
// identical data. The in-flight promise collapses concurrent callers into ONE
// round-trip, then clears so a later refetch (e.g. after accepting a request)
// still gets fresh rows.
let pendingReqsInFlight: Promise<AllPendingRequestsResponse> | null = null;

async function getAllPendingRequests(): Promise<AllPendingRequestsResponse> {
  if (pendingReqsInFlight) return pendingReqsInFlight;
  pendingReqsInFlight = (async () => {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { received: [], sent: [], totalReceived: 0, totalSent: 0 };
    }

    const [receivedRes, sentRes] = await Promise.all([
      supabase
        .from('friendships')
        .select('*')
        .eq('status', 'pending')
        .eq('recipient_id', userId),
      supabase
        .from('friendships')
        .select('*')
        .eq('status', 'pending')
        .eq('requester_id', userId),
    ]);

    const receivedRows = (receivedRes.data ?? []) as DbFriendship[];
    const sentRows = (sentRes.data ?? []) as DbFriendship[];

    const profiles = await hydrateProfiles([
      ...receivedRows.map((r) => r.requester_id),
      ...sentRows.map((r) => r.recipient_id),
    ]);

    return {
      received: receivedRows.map((r) => rowToRequest(r, profiles.get(r.requester_id))),
      sent: sentRows.map((r) => rowToRequest(r, profiles.get(r.recipient_id))),
      totalReceived: receivedRows.length,
      totalSent: sentRows.length,
    };
  })();
  try {
    return await pendingReqsInFlight;
  } finally {
    pendingReqsInFlight = null;
  }
}

async function getPendingRequests(): Promise<PendingRequestsResponse> {
  const all = await getAllPendingRequests();
  return { requests: all.received, count: all.totalReceived };
}

async function getSentRequests(): Promise<PendingRequestsResponse> {
  const all = await getAllPendingRequests();
  return { requests: all.sent, count: all.totalSent };
}

export const requestsService = {
  sendFriendRequest,
  getFriendRequestQuota,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getRequesterProfile,
  getAllPendingRequests,
  getPendingRequests,
  getSentRequests,
};
