/**
 * Public types for the friendships service layer. Shared by the request,
 * friends, and suggestions modules and re-exported through
 * [`friendships.service.ts`](./friendships.service.ts).
 */

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
