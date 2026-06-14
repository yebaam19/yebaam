'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFriendships } from '@/features/friendships';
import type { TabType } from './components';

interface OpenChat {
  contactId: string;
  contactName: string;
  contactAvatar: string;
}

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmAction: () => void;
  type: 'danger' | 'warning';
}

const VALID_TABS: TabType[] = ['friends', 'requests', 'sent', 'suggestions'];

/**
 * View-model for the `/feed/friends` page: tab + manager-panel state synced to
 * the `?tab=` query param, the friendships data, the chat-bubble stack, the
 * confirm-modal state, and all the friend/request/suggestion action handlers —
 * leaving the page as a pure render shell.
 */
export function useFriendsManager() {
  const t = useTranslations('feed');
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const initialTab = tabParam && (VALID_TABS as string[]).includes(tabParam) ? (tabParam as TabType) : 'friends';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [managerOpen, setManagerOpen] = useState<boolean>(Boolean(tabParam));
  const managerRef = useRef<HTMLDivElement>(null);

  const handleFindFriends = useCallback(() => {
    setActiveTab('suggestions');
    setManagerOpen(true);
    router.replace('/feed/friends?tab=suggestions', { scroll: false });
    requestAnimationFrame(() => {
      managerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [router]);

  useEffect(() => {
    const t = searchParams?.get('tab');
    if (t && (VALID_TABS as string[]).includes(t)) {
      setActiveTab(t as TabType);
      setManagerOpen(true);
    }
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const [openChats, setOpenChats] = useState<OpenChat[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    confirmAction: () => {},
    type: 'warning',
  });

  const {
    friends,
    pendingRequests,
    sentRequests,
    suggestions,
    totalFriends,
    closeFriendsCount,
    pendingCount,
    suggestionsCount,
    isLoading,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    updateFriendConfig,
    sendFriendRequest,
  } = useFriendships();

  const stats = {
    totalFriends,
    closeFriends: closeFriendsCount,
    pendingRequests: pendingCount,
    sentRequests: sentRequests?.length || 0,
    suggestions: suggestionsCount,
  };

  const handleToggleCloseFriend = async (friendId: string) => {
    const friend = friends?.find((f) => f.friendId === friendId);
    if (!friend) return;
    await updateFriendConfig(friendId, { closeFriend: !friend.closeFriend });
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    const friend = friends?.find((f) => f.friendshipId === friendshipId);
    const friendName = friend ? `${friend.firstName} ${friend.lastName}` : t('friends.sentCard.fallbackPerson');

    setConfirmModal({
      isOpen: true,
      title: t('friends.remove.title'),
      message: t('friends.remove.message', { name: friendName }),
      confirmText: t('friends.remove.confirm'),
      type: 'danger',
      confirmAction: async () => {
        await removeFriend(friendshipId);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleOpenChat = (friendId: string) => {
    const friend = friends?.find((f) => f.friendId === friendId);
    if (!friend) return;
    setOpenChats((prev) => {
      if (prev.some((c) => c.contactId === friendId)) return prev;
      const next = prev.length >= 3 ? prev.slice(1) : prev;
      const name =
        friend.firstName && friend.lastName ? `${friend.firstName} ${friend.lastName}` : friend.username;
      return [...next, { contactId: friendId, contactName: name, contactAvatar: friend.avatar || '' }];
    });
  };

  const handleCloseChat = (contactId: string) => {
    setOpenChats((prev) => prev.filter((c) => c.contactId !== contactId));
  };

  const handleDismissSuggestion = (id: string) => {
    setDismissedSuggestions((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const visibleSuggestions = useMemo(
    () => (suggestions || []).filter((s) => !dismissedSuggestions.has(s.id)),
    [suggestions, dismissedSuggestions],
  );

  const handleCancelRequest = async (requestId: string) => {
    setConfirmModal({
      isOpen: true,
      title: t('friends.cancelRequest.title'),
      message: t('friends.cancelRequest.message'),
      confirmText: t('friends.cancelRequest.confirm'),
      type: 'warning',
      confirmAction: async () => {
        await cancelFriendRequest(requestId);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'friends':
        return t('friends.search.friends');
      case 'requests':
        return t('friends.search.requests');
      case 'sent':
        return t('friends.search.sent');
      case 'suggestions':
        return t('friends.search.suggestions');
      default:
        return t('friends.search.default');
    }
  };

  return {
    managerRef,
    managerOpen,
    setManagerOpen,
    handleFindFriends,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    getSearchPlaceholder,
    stats,
    pendingCount,
    isLoading,
    friends,
    pendingRequests,
    sentRequests,
    visibleSuggestions,
    acceptFriendRequest,
    rejectFriendRequest,
    sendFriendRequest,
    handleToggleCloseFriend,
    handleRemoveFriend,
    handleOpenChat,
    handleDismissSuggestion,
    handleCancelRequest,
    openChats,
    handleCloseChat,
    confirmModal,
    setConfirmModal,
  };
}
