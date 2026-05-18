'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useFriendshipsStore } from '../../store/friendships.store';
import type { FriendButtonProps, FriendshipState } from './types';

/**
 * View-model for the FriendButton family. Pulls reactive state out of the
 * Zustand store, derives the current `FriendshipState` + matching
 * `friendshipId`, and exposes the 5 action handlers.
 *
 * `runWithLoading` collapses the 5 near-identical try/catch/finally skeletons
 * that lived inline on the old `FriendButton` into one parametric helper —
 * before: 5×`setIsLoading(true); try { await x(); cb?.(); } catch {} finally { setIsLoading(false); }`.
 */
export interface FriendshipUI {
  isInitialized: boolean;
  isLoading: boolean;
  currentState: FriendshipState;
  friendshipId: string | undefined;
  handlers: {
    sendRequest: () => Promise<void>;
    cancelRequest: () => Promise<void>;
    acceptRequest: () => Promise<void>;
    rejectRequest: () => Promise<void>;
    unfriend: () => Promise<void>;
  };
  dropdown: {
    showOptions: boolean;
    toggleOptions: () => void;
    showUnfriendConfirm: boolean;
    openUnfriendConfirm: () => void;
    cancelUnfriendConfirm: () => void;
  };
  hover: {
    isHovering: boolean;
    setHovering: (value: boolean) => void;
  };
}

type Callbacks = Pick<
  FriendButtonProps,
  'onRequestSent' | 'onRequestCancelled' | 'onRequestAccepted' | 'onRequestRejected' | 'onUnfriended'
>;

export function useFriendshipUI(userId: string, callbacks: Callbacks): FriendshipUI {
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Callers typically pass a fresh `callbacks` object literal every render
  // (the props are stable, but the wrapping object isn't). Holding the latest
  // value in a ref keeps the handler `useCallback` deps free of that object
  // identity — otherwise every parent render would invalidate every handler.
  // This is the `advanced-use-latest` pattern from vercel-react-best-practices.
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const getFriendshipStatus = useFriendshipsStore((state) => state.getFriendshipStatus);
  const friends = useFriendshipsStore((state) => state.friends);
  const sentRequests = useFriendshipsStore((state) => state.sentRequests);
  const pendingRequests = useFriendshipsStore((state) => state.pendingRequests);
  const isInitialized = useFriendshipsStore((state) => state.isInitialized);

  const {
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
  } = useFriendshipsStore();

  const currentState = useMemo<FriendshipState>(
    () => getFriendshipStatus(userId),
    [getFriendshipStatus, userId, friends, sentRequests, pendingRequests],
  );

  const friendshipId = useMemo(() => {
    if (currentState === 'friends') {
      return friends.find((f) => f.friendId === userId)?.friendshipId;
    }
    if (currentState === 'pending-sent') {
      return sentRequests.find((r) => r.addresseeId === userId && r.status === 'pending')?.id;
    }
    if (currentState === 'pending-received') {
      return pendingRequests.find((r) => r.requesterId === userId && r.status === 'pending')?.id;
    }
    return undefined;
  }, [currentState, userId, friends, sentRequests, pendingRequests]);

  // Errors are surfaced by the store via toast; the handlers swallow here to
  // guarantee `setIsLoading(false)` runs and the UI doesn't get stuck.
  const runWithLoading = useCallback(
    async (op: () => Promise<unknown>, onSuccess?: () => void) => {
      setIsLoading(true);
      try {
        await op();
        onSuccess?.();
      } catch {
        // store already toasted
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const sendRequest = useCallback(
    () =>
      runWithLoading(
        () => sendFriendRequest({ addresseeId: userId }),
        () => callbacksRef.current.onRequestSent?.(userId),
      ),
    [runWithLoading, sendFriendRequest, userId],
  );

  const cancelRequest = useCallback(async () => {
    if (!friendshipId) return;
    await runWithLoading(
      () => cancelFriendRequest(friendshipId),
      () => callbacksRef.current.onRequestCancelled?.(friendshipId),
    );
  }, [runWithLoading, cancelFriendRequest, friendshipId]);

  const acceptRequest = useCallback(async () => {
    if (!friendshipId) return;
    await runWithLoading(
      () => acceptFriendRequest(friendshipId),
      () => callbacksRef.current.onRequestAccepted?.(friendshipId),
    );
  }, [runWithLoading, acceptFriendRequest, friendshipId]);

  const rejectRequest = useCallback(async () => {
    if (!friendshipId) return;
    await runWithLoading(
      () => rejectFriendRequest(friendshipId),
      () => callbacksRef.current.onRequestRejected?.(friendshipId),
    );
  }, [runWithLoading, rejectFriendRequest, friendshipId]);

  const unfriend = useCallback(async () => {
    if (!friendshipId) return;
    await runWithLoading(
      () => removeFriend(friendshipId),
      () => {
        callbacksRef.current.onUnfriended?.(friendshipId);
        setShowOptions(false);
        setShowUnfriendConfirm(false);
      },
    );
  }, [runWithLoading, removeFriend, friendshipId]);

  return {
    isInitialized,
    isLoading,
    currentState,
    friendshipId,
    handlers: { sendRequest, cancelRequest, acceptRequest, rejectRequest, unfriend },
    dropdown: {
      showOptions,
      toggleOptions: useCallback(() => setShowOptions((v) => !v), []),
      showUnfriendConfirm,
      openUnfriendConfirm: useCallback(() => setShowUnfriendConfirm(true), []),
      cancelUnfriendConfirm: useCallback(() => setShowUnfriendConfirm(false), []),
    },
    hover: { isHovering, setHovering: setIsHovering },
  };
}
