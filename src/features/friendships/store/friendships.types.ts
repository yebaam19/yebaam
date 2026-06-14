import type {
  Friend,
  FriendRequest,
  FriendSuggestion,
  SendFriendRequestDto,
  UpdateFriendConfigDto,
} from '../services/friendships.service';

// ============================================================================
// TYPES
// ============================================================================

export interface FriendshipsState {
  // Estado
  friends: Friend[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  suggestions: FriendSuggestion[];
  isLoading: boolean;
  isInitialized: boolean; // Nuevo: indica si ya se cargaron los datos iniciales
  error: string | null;

  // Stats
  totalFriends: number;
  closeFriendsCount: number;
  pendingCount: number;
  suggestionsCount: number;

  // Acciones - API Calls
  initializeFriendships: () => Promise<void>; // Nuevo: carga todos los datos iniciales
  fetchFriends: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  fetchSentRequests: () => Promise<void>;
  fetchSuggestions: (limit?: number) => Promise<void>;
  sendFriendRequest: (data: SendFriendRequestDto) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  cancelFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  updateFriendConfig: (friendId: string, config: UpdateFriendConfigDto) => Promise<void>;

  // Acciones - WebSocket Events
  handleFriendRequestSent: (request: FriendRequest) => void;
  handleFriendRequestAccepted: (request: FriendRequest) => void;
  handleFriendRequestRejected: (request: FriendRequest) => void;
  handleFriendRequestCancelled: (request: FriendRequest) => void;
  handleFriendAdded: (data: { userId: string; friendId: string }) => void;
  handleFriendRemoved: (data: { userId: string; friendId: string }) => void;

  // Utilidades
  getFriendshipStatus: (userId: string) => 'friends' | 'pending-sent' | 'pending-received' | 'none';
  reset: () => void;
}

/**
 * The zustand `set` signature for this store, as provided to slice factories.
 */
export type FriendshipsSet = (
  partial:
    | FriendshipsState
    | Partial<FriendshipsState>
    | ((state: FriendshipsState) => FriendshipsState | Partial<FriendshipsState>),
  replace?: false
) => void;

/**
 * The zustand `get` signature for this store.
 */
export type FriendshipsGet = () => FriendshipsState;
