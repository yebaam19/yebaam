import type { FriendshipsState } from './friendships.types';

/**
 * The data-only slice of {@link FriendshipsState} — the 11 non-action fields.
 * Used both for the store's initial state and by `reset()`.
 */
export const friendshipsInitialState: Pick<
  FriendshipsState,
  | 'friends'
  | 'pendingRequests'
  | 'sentRequests'
  | 'suggestions'
  | 'isLoading'
  | 'isInitialized'
  | 'error'
  | 'totalFriends'
  | 'closeFriendsCount'
  | 'pendingCount'
  | 'suggestionsCount'
> = {
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  suggestions: [],
  isLoading: false,
  isInitialized: false,
  error: null,
  totalFriends: 0,
  closeFriendsCount: 0,
  pendingCount: 0,
  suggestionsCount: 0,
};
