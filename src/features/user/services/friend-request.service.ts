import { friendshipsService } from '@/features/friendships/services/friendships.service';

export interface FriendSuggestion {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  mutualFriends: number;
  location?: string | { city?: string; country?: string };
  reason: string;
}

export interface FriendRequest {
  requestId: string;
  fromUserId?: string;
  toUserId?: string;
  message?: string;
  sentAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  profile?: {
    id?: string;
    username: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    avatar?: string;
    location?: string;
  };
  senderProfile?: FriendRequest['profile'];
  recipientProfile?: FriendRequest['profile'];
}

export interface GetFriendRequestsResponse {
  received: FriendRequest[];
  sent: FriendRequest[];
  total: number;
}

export interface SendFriendRequestResponse {
  success: boolean;
  requestId: string;
  message: string;
}

export interface FriendRequestActionResponse {
  success: boolean;
  message: string;
  friendId?: string;
}

export const friendRequestService = {
  async getFriendRequests(): Promise<GetFriendRequestsResponse> {
    const all = await friendshipsService.getAllPendingRequests();
    const map = (r: (typeof all.received)[number]): FriendRequest => ({
      requestId: r.id,
      fromUserId: r.requesterId,
      toUserId: r.addresseeId,
      sentAt: r.sentAt,
      status: r.status === 'accepted' ? 'accepted' : r.status === 'rejected' ? 'rejected' : 'pending',
      profile: r.profile
        ? {
            id: r.profile.id,
            username: r.profile.username,
            firstName: r.profile.firstName,
            lastName: r.profile.lastName,
            avatar: r.profile.avatar,
          }
        : undefined,
    });
    const received = all.received.map(map);
    const sent = all.sent.map(map);
    return { received, sent, total: received.length + sent.length };
  },

  async sendFriendRequest(recipientId: string): Promise<SendFriendRequestResponse> {
    const req = await friendshipsService.sendFriendRequest({ addresseeId: recipientId });
    return { success: true, requestId: req.id, message: 'Solicitud enviada' };
  },

  async acceptFriendRequest(requestId: string): Promise<FriendRequestActionResponse> {
    const req = await friendshipsService.acceptFriendRequest(requestId);
    return { success: true, message: 'Solicitud aceptada', friendId: req.requesterId };
  },

  async rejectFriendRequest(requestId: string): Promise<FriendRequestActionResponse> {
    await friendshipsService.rejectFriendRequest(requestId);
    return { success: true, message: 'Solicitud rechazada' };
  },

  async cancelFriendRequest(requestId: string): Promise<FriendRequestActionResponse> {
    await friendshipsService.cancelFriendRequest(requestId);
    return { success: true, message: 'Solicitud cancelada' };
  },

  async getFriendSuggestions(limit: number = 4): Promise<FriendSuggestion[]> {
    const suggestions = await friendshipsService.getFriendSuggestions(limit);
    return suggestions.map((s) => ({
      id: s.id,
      username: s.username,
      firstName: s.firstName,
      lastName: s.lastName,
      avatar: s.avatar,
      mutualFriends: s.mutualFriends,
      reason: s.reason,
    }));
  },
};
