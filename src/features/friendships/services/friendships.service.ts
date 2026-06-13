import { requestsService } from './requests.service';
import { friendsService } from './friends.service';
import { suggestionsService } from './suggestions.service';

/**
 * Public entry point for the friendships service layer. The implementation is
 * split by concern into the sibling modules below; this file preserves the
 * historical `friendships.service` import surface — the `friendshipsService`
 * object, every public type, and `FriendRequestBlockedError`.
 *
 * - {@link ./requests.service}    — request lifecycle (send/quota/accept/reject/cancel, pending lists)
 * - {@link ./friends.service}     — friends list, per-friend settings, remove/config
 * - {@link ./suggestions.service} — suggestions + online presence
 * - {@link ./friendships.types}   — shared DTOs/response shapes
 * - {@link ./friendships.errors}  — FriendRequestBlockedError + block messages
 */

export type {
  FriendRequestStatus,
  FriendRequest,
  Friend,
  FriendsListResponse,
  PendingRequestsResponse,
  AllPendingRequestsResponse,
  SendFriendRequestDto,
  FriendRequestBlockReason,
  FriendRequestQuota,
  UpdateFriendConfigDto,
  FriendSuggestion,
} from './friendships.types';

export { FriendRequestBlockedError } from './friendships.errors';

export const friendshipsService = {
  ...requestsService,
  ...friendsService,
  ...suggestionsService,
};
