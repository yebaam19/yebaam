import { supabase } from '@/utils/supabase/client';
import { getCurrentUserId } from '@/utils/supabase/current-user';

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface FriendRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendRequestStatus;
  message?: string;
  sentAt: string;
  respondedAt?: string;
  profile?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  senderProfile?: FriendRequest['profile'];
  recipientProfile?: FriendRequest['profile'];
}

export interface Friend {
  friendId: string;
  friendshipId?: string;
  friendSince: string;
  closeFriend: boolean;
  restricted: boolean;
  nickname?: string;
  firstName?: string;
  lastName?: string;
  username: string;
  avatar?: string;
}

export interface FriendsListResponse {
  friends: Friend[];
  count: number;
  closeFriendsCount: number;
}

export interface PendingRequestsResponse {
  requests: FriendRequest[];
  count: number;
}

export interface AllPendingRequestsResponse {
  received: FriendRequest[];
  sent: FriendRequest[];
  totalReceived: number;
  totalSent: number;
}

export interface SendFriendRequestDto {
  addresseeId: string;
  message?: string;
}

export type FriendRequestBlockReason =
  | 'hourly_limit'
  | 'daily_limit'
  | 'weekly_limit'
  | 'new_account_daily_limit'
  | 'frozen'
  | 'already_pending'
  | 'already_friends'
  | 'blocked'
  | 'invalid_addressee'
  | 'unauthenticated';

export interface FriendRequestQuota {
  counts: { hour: number; day: number; week: number };
  limits: { hour: number; day: number; week: number };
  isNewAccount: boolean;
  freeze: { until: string; reason: string } | null;
}

/**
 * Thrown when the RPC rejects a send for a known business reason (rate limit,
 * freeze, duplicate). Carries the structured payload so the UI can show a
 * specific message and unfreeze countdown without re-querying.
 */
export class FriendRequestBlockedError extends Error {
  reason: FriendRequestBlockReason;
  unfreezeAt?: string;
  counts?: { hour: number; day: number; week: number };
  limits?: { hour: number; day: number; week: number };
  freezeReason?: string;

  constructor(reason: FriendRequestBlockReason, message: string, extras: {
    unfreezeAt?: string;
    counts?: { hour: number; day: number; week: number };
    limits?: { hour: number; day: number; week: number };
    freezeReason?: string;
  } = {}) {
    super(message);
    this.name = 'FriendRequestBlockedError';
    this.reason = reason;
    this.unfreezeAt = extras.unfreezeAt;
    this.counts = extras.counts;
    this.limits = extras.limits;
    this.freezeReason = extras.freezeReason;
  }
}

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

function blockMessageFor(
  reason: FriendRequestBlockReason,
  unfreezeAt: string | undefined,
): string {
  const when = unfreezeAt ? formatUnfreezeRelative(unfreezeAt) : null;
  switch (reason) {
    case 'hourly_limit':
      return when
        ? `Alcanzaste el límite de 3 solicitudes por hora. Podrás enviar más ${when}.`
        : 'Alcanzaste el límite de 3 solicitudes por hora.';
    case 'daily_limit':
      return when
        ? `Alcanzaste el límite de 10 solicitudes por día. Podrás enviar más ${when}.`
        : 'Alcanzaste el límite de 10 solicitudes por día.';
    case 'weekly_limit':
      return when
        ? `Alcanzaste el límite de 40 solicitudes por semana. Podrás enviar más ${when}.`
        : 'Alcanzaste el límite de 40 solicitudes por semana.';
    case 'new_account_daily_limit':
      return when
        ? `Las cuentas nuevas pueden enviar 3 solicitudes por día. Podrás enviar más ${when}.`
        : 'Las cuentas nuevas pueden enviar 3 solicitudes por día durante sus primeros 7 días.';
    case 'frozen':
      return when
        ? `Tu cuenta tiene un bloqueo temporal en solicitudes de amistad. Se levantará ${when}.`
        : 'Tu cuenta tiene un bloqueo temporal en solicitudes de amistad.';
    case 'already_pending':
      return 'Ya existe una solicitud pendiente con este usuario';
    case 'already_friends':
      return 'Ya son amigos';
    case 'blocked':
      return 'No es posible enviar una solicitud a este usuario';
    case 'invalid_addressee':
      return 'Destinatario inválido';
    case 'unauthenticated':
      return 'Debes iniciar sesión para enviar solicitudes';
    default:
      return 'No se pudo enviar la solicitud';
  }
}

function formatUnfreezeRelative(iso: string): string {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return '';
  const diffMs = target - Date.now();
  if (diffMs <= 0) return 'en unos momentos';
  const totalMin = Math.ceil(diffMs / 60000);
  if (totalMin < 60) return `en ${totalMin} min`;
  const totalH = Math.ceil(totalMin / 60);
  if (totalH < 48) return `en ~${totalH} h`;
  const totalD = Math.ceil(totalH / 24);
  return `en ~${totalD} días`;
}

export interface UpdateFriendConfigDto {
  closeFriend?: boolean;
  restricted?: boolean;
  nickname?: string;
}

export interface FriendSuggestion {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  mutualFriends: number;
  location?: string;
  bio?: string;
  reason: string;
}

type DbFriendship = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  accepted_at: string | null;
};

type DbProfile = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

type DbFriendSettings = {
  owner_id: string;
  friend_id: string;
  close_friend: boolean;
  restricted: boolean;
  nickname: string | null;
};

async function hydrateProfiles(ids: string[]): Promise<Map<string, DbProfile>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url')
    .in('id', Array.from(new Set(ids)));
  const map = new Map<string, DbProfile>();
  for (const p of (data ?? []) as DbProfile[]) map.set(p.id, p);
  return map;
}

function profileToShortDto(profile: DbProfile | undefined, fallbackId: string) {
  if (!profile) return { id: fallbackId, username: '', firstName: '', lastName: '' };
  return {
    id: profile.id,
    username: profile.username ?? '',
    firstName: profile.first_name ?? '',
    lastName: profile.last_name ?? '',
    avatar: profile.avatar_url ?? undefined,
  };
}

function rowToRequest(row: DbFriendship, profile?: DbProfile): FriendRequest {
  return {
    id: row.id,
    requesterId: row.requester_id,
    addresseeId: row.recipient_id,
    status: row.status as FriendRequestStatus,
    sentAt: row.created_at,
    respondedAt: row.accepted_at ?? undefined,
    profile: profile ? profileToShortDto(profile, profile.id) : undefined,
  };
}

export const friendshipsService = {
  async sendFriendRequest(data: SendFriendRequestDto): Promise<FriendRequest> {
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
  },

  async getFriendRequestQuota(): Promise<FriendRequestQuota | null> {
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
  },

  async acceptFriendRequest(requestId: string): Promise<FriendRequest> {
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
  },

  async rejectFriendRequest(requestId: string): Promise<FriendRequest> {
    const { data, error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId)
      .select('*')
      .single();
    if (error || !data) throw new Error(error?.message || 'Error al rechazar solicitud');
    return rowToRequest(data as DbFriendship);
  },

  async cancelFriendRequest(requestId: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId);
    if (error) throw new Error(error.message || 'Error al cancelar solicitud');
    return { success: true, message: 'Solicitud cancelada' };
  },

  async getRequesterProfile(friendshipId: string) {
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
  },

  async getFriends(): Promise<FriendsListResponse> {
    const userId = await getCurrentUserId();
    if (!userId) return { friends: [], count: 0, closeFriendsCount: 0 };

    const { data } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

    const rows = (data ?? []) as DbFriendship[];
    const friendIds = rows.map((r) => (r.requester_id === userId ? r.recipient_id : r.requester_id));

    const [profiles, settings] = await Promise.all([
      hydrateProfiles(friendIds),
      this.getFriendSettingsMap(userId, friendIds),
    ]);

    const friends: Friend[] = rows.map((r) => {
      const fid = r.requester_id === userId ? r.recipient_id : r.requester_id;
      const p = profiles.get(fid);
      const s = settings.get(fid);
      return {
        friendId: fid,
        friendshipId: r.id,
        friendSince: r.accepted_at ?? r.created_at,
        closeFriend: s?.close_friend ?? false,
        restricted: s?.restricted ?? false,
        nickname: s?.nickname ?? undefined,
        firstName: p?.first_name ?? undefined,
        lastName: p?.last_name ?? undefined,
        username: p?.username ?? `User-${fid.slice(0, 8)}`,
        avatar: p?.avatar_url ?? undefined,
      };
    });

    return {
      friends,
      count: friends.length,
      closeFriendsCount: friends.filter((f) => f.closeFriend).length,
    };
  },

  async getFriendsOf(userId: string): Promise<FriendsListResponse> {
    if (!userId) return { friends: [], count: 0, closeFriendsCount: 0 };

    const { data } = await supabase
      .from('friendships')
      .select('*')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

    const rows = (data ?? []) as DbFriendship[];
    const friendIds = rows.map((r) => (r.requester_id === userId ? r.recipient_id : r.requester_id));
    const profiles = await hydrateProfiles(friendIds);

    const friends: Friend[] = rows.map((r) => {
      const fid = r.requester_id === userId ? r.recipient_id : r.requester_id;
      const p = profiles.get(fid);
      return {
        friendId: fid,
        friendshipId: r.id,
        friendSince: r.accepted_at ?? r.created_at,
        closeFriend: false,
        restricted: false,
        firstName: p?.first_name ?? undefined,
        lastName: p?.last_name ?? undefined,
        username: p?.username ?? `User-${fid.slice(0, 8)}`,
        avatar: p?.avatar_url ?? undefined,
      };
    });

    return { friends, count: friends.length, closeFriendsCount: 0 };
  },

  async getFriendSettingsMap(
    ownerId: string,
    friendIds: string[]
  ): Promise<Map<string, DbFriendSettings>> {
    if (friendIds.length === 0) return new Map();
    const { data } = await supabase
      .from('friend_settings')
      .select('*')
      .eq('owner_id', ownerId)
      .in('friend_id', friendIds);
    const map = new Map<string, DbFriendSettings>();
    for (const s of (data ?? []) as DbFriendSettings[]) map.set(s.friend_id, s);
    return map;
  },

  async getAllPendingRequests(): Promise<AllPendingRequestsResponse> {
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
  },

  async getPendingRequests(): Promise<PendingRequestsResponse> {
    const all = await this.getAllPendingRequests();
    return { requests: all.received, count: all.totalReceived };
  },

  async getSentRequests(): Promise<PendingRequestsResponse> {
    const all = await this.getAllPendingRequests();
    return { requests: all.sent, count: all.totalSent };
  },

  async removeFriend(friendshipId: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    if (error) throw new Error(error.message || 'Error al eliminar amigo');
    return { success: true, message: 'Amigo eliminado' };
  },

  async updateFriendConfig(friendId: string, config: UpdateFriendConfigDto): Promise<Friend> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const payload: Partial<DbFriendSettings> & { owner_id: string; friend_id: string } = {
      owner_id: userId,
      friend_id: friendId,
    };
    if (config.closeFriend !== undefined) payload.close_friend = config.closeFriend;
    if (config.restricted !== undefined) payload.restricted = config.restricted;
    if (config.nickname !== undefined) payload.nickname = config.nickname;

    const { data: existing } = await supabase
      .from('friend_settings')
      .select('*')
      .eq('owner_id', userId)
      .eq('friend_id', friendId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('friend_settings')
        .update(payload)
        .eq('owner_id', userId)
        .eq('friend_id', friendId);
    } else {
      await supabase.from('friend_settings').insert([payload]);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, avatar_url')
      .eq('id', friendId)
      .maybeSingle();
    const p = profile as DbProfile | null;

    return {
      friendId,
      friendSince: '',
      closeFriend: payload.close_friend ?? false,
      restricted: payload.restricted ?? false,
      nickname: payload.nickname ?? undefined,
      firstName: p?.first_name ?? undefined,
      lastName: p?.last_name ?? undefined,
      username: p?.username ?? '',
      avatar: p?.avatar_url ?? undefined,
    };
  },

  async getFriendSuggestions(limit: number = 10): Promise<FriendSuggestion[]> {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase.rpc('friend_suggestions', {
      for_user: userId,
      max_results: limit,
    });
    if (error || !data) return [];

    return (
      data as {
        id: string;
        username: string | null;
        first_name: string | null;
        last_name: string | null;
        avatar_url: string | null;
        mutual_friends: number;
      }[]
    ).map((row) => ({
      id: row.id,
      username: row.username ?? '',
      firstName: row.first_name ?? '',
      lastName: row.last_name ?? '',
      avatar: row.avatar_url ?? undefined,
      mutualFriends: row.mutual_friends,
      reason: 'Usuario sugerido',
    }));
  },

  async getOnlineFriends(): Promise<string[]> {
    // Online presence not yet supported — returns empty.
    // Will be wired up when realtime presence is enabled.
    return [];
  },
};
