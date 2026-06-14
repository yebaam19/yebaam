import type { Friend } from '../services/friendships.service';
import type { FriendshipsState } from './friendships.types';

/**
 * Collapses the repeated `error instanceof Error ? error.message : '<fallback>'`
 * ternary used throughout the store's catch blocks.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * The close-friend-aware friend-removal reducer shared by `removeFriend`
 * (predicate `f => f.friendshipId === id`) and `handleFriendRemoved`
 * (predicate `f => f.friendId === id`). Parameterized by the match predicate so
 * each caller keeps its original matching key. Returns only the shared shape;
 * callers spread in any extra fields (e.g. `isLoading: false`) themselves.
 */
export function removeFriendFromList(
  state: FriendshipsState,
  predicate: (friend: Friend) => boolean
): Pick<FriendshipsState, 'friends' | 'totalFriends' | 'closeFriendsCount'> {
  const friend = state.friends.find(predicate);
  const wasCloseFriend = friend?.closeFriend || false;

  return {
    friends: state.friends.filter((f) => !predicate(f)),
    totalFriends: state.totalFriends - 1,
    closeFriendsCount: wasCloseFriend
      ? state.closeFriendsCount - 1
      : state.closeFriendsCount,
  };
}

/**
 * Obtener estado de amistad con un usuario específico
 */
export function computeFriendshipStatus(
  state: FriendshipsState,
  userId: string
): 'friends' | 'pending-sent' | 'pending-received' | 'none' {
  if (state.friends.some(f => f.friendId === userId)) return 'friends';

  const sentRequest = state.sentRequests.find(r => r.addresseeId === userId && r.status === 'pending');
  if (sentRequest) return 'pending-sent';

  const receivedRequest = state.pendingRequests.find(r => r.requesterId === userId && r.status === 'pending');
  if (receivedRequest) return 'pending-received';

  return 'none';
}
