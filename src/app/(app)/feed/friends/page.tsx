'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FriendCard } from '@/features/user/components/FriendCard';
import { FriendRequestCard } from '@/features/user/components/FriendRequestCard';
import { SuggestionCard } from '@/features/user/components/SuggestionCard';
import { FriendSuggestionsCompact } from '@/features/user/components/FriendSuggestionCard';
import { useFriendships } from '@/features/friendships';
import ChatBubble from '@/components/chat/ChatBubble';
import { FriendsStats, FriendsTabs, SearchBar, ConfirmModal, type TabType } from './components';
import { FriendsHero } from './components/FriendsHero';
import { ProfileProgress } from './components/ProfileProgress';
import { SuggestedPeopleRail } from './components/SuggestedPeopleRail';
import { RecentActivity } from './components/RecentActivity';
import { ChevronDownIcon } from '@/components/icons/heroicons-shim';

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

export default function FriendsPage() {
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
    const friendName = friend ? `${friend.firstName} ${friend.lastName}` : 'esta persona';

    setConfirmModal({
      isOpen: true,
      title: 'Eliminar amigo',
      message: `¿Estás seguro de que quieres eliminar a ${friendName} de tu lista de amigos?`,
      confirmText: 'Eliminar',
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
      title: 'Cancelar solicitud',
      message: '¿Estás seguro de que quieres cancelar esta solicitud de amistad?',
      confirmText: 'Cancelar solicitud',
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
        return 'Buscar amigos...';
      case 'requests':
        return 'Buscar solicitudes...';
      case 'sent':
        return 'Buscar enviadas...';
      case 'suggestions':
        return 'Buscar sugerencias...';
      default:
        return 'Buscar...';
    }
  };

  return (
    <div className="min-w-0">
      <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="space-y-5 sm:space-y-6">
          <FriendsHero onFindFriends={handleFindFriends} />
          <ProfileProgress />
          <SuggestedPeopleRail />
          <RecentActivity />

          <div
            ref={managerRef}
            className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
          >
            <button
              type="button"
              onClick={() => setManagerOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-6"
              aria-expanded={managerOpen}
            >
              <div>
                <h2 className="text-base font-semibold text-neutral-900 sm:text-lg dark:text-white">
                  Gestión avanzada
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Administra amigos, solicitudes y sugerencias en detalle
                </p>
              </div>
              <ChevronDownIcon
                className={`size-5 shrink-0 text-neutral-500 transition-transform ${
                  managerOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {managerOpen && (
              <div className="border-t border-neutral-200 px-3 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-6 dark:border-neutral-800">
                <div className="space-y-4 sm:space-y-6">
                  <FriendsStats
                    totalFriends={stats.totalFriends}
                    closeFriends={stats.closeFriends}
                    pendingRequests={stats.pendingRequests}
                    sentRequests={stats.sentRequests}
                    suggestions={stats.suggestions}
                  />

                  <FriendsTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    pendingCount={pendingCount}
                    sentCount={sentRequests?.length || 0}
                  />

                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder={getSearchPlaceholder()}
                  />

                  <div className="min-h-72 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-6 dark:border-neutral-800 dark:bg-neutral-900">
                    {activeTab === 'friends' &&
                      (isLoading ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div
                              key={i}
                              className="h-48 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800"
                            />
                          ))}
                        </div>
                      ) : !friends || friends.length === 0 ? (
                        <div className="py-16 text-center">
                          <p className="text-neutral-500 dark:text-neutral-400">
                            No tienes amigos aún. Explora las sugerencias para conectar con otros usuarios.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3">
                          {friends.map((friend) => (
                            <FriendCard
                              key={friend.friendId}
                              friend={friend as any}
                              onToggleCloseFriend={handleToggleCloseFriend}
                              onRemove={handleRemoveFriend}
                              onChat={handleOpenChat}
                            />
                          ))}
                        </div>
                      ))}

                    {activeTab === 'requests' &&
                      (isLoading ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div
                              key={i}
                              className="h-64 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800"
                            />
                          ))}
                        </div>
                      ) : !pendingRequests || pendingRequests.length === 0 ? (
                        <div className="py-16 text-center">
                          <p className="text-neutral-500 dark:text-neutral-400">
                            No tienes solicitudes pendientes
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3">
                          {pendingRequests.map((request) => (
                            <FriendRequestCard
                              key={request.id}
                              request={{
                                requestId: request.id,
                                fromUserId: request.requesterId,
                                message: request.message,
                                sentAt: request.sentAt,
                                status: request.status as 'pending' | 'accepted' | 'rejected',
                                profile: request.profile ||
                                  request.senderProfile || {
                                    id: request.requesterId,
                                    username: `user_${request.requesterId.slice(0, 8)}`,
                                    firstName: 'Usuario',
                                    lastName: request.requesterId.slice(0, 8),
                                    avatar: undefined,
                                  },
                              }}
                              onAccept={acceptFriendRequest}
                              onReject={rejectFriendRequest}
                            />
                          ))}
                        </div>
                      ))}

                    {activeTab === 'sent' &&
                      (isLoading ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div
                              key={i}
                              className="h-64 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800"
                            />
                          ))}
                        </div>
                      ) : !sentRequests || sentRequests.length === 0 ? (
                        <div className="py-16 text-center">
                          <p className="text-neutral-500 dark:text-neutral-400">No has enviado solicitudes</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3">
                          {sentRequests.map((request) => {
                            const profile = request.profile || request.recipientProfile;

                            const displayName = profile
                              ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
                                profile.username
                              : `${request.addresseeId?.slice(0, 8)}`;

                            const initial =
                              profile?.firstName?.charAt(0)?.toUpperCase() ||
                              profile?.username?.charAt(0)?.toUpperCase() ||
                              request.addresseeId?.charAt(0)?.toUpperCase() ||
                              '?';

                            return (
                              <div
                                key={`sent-${request.id}`}
                                className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-800"
                              >
                                <div className="flex items-start gap-4">
                                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary-400 to-primary-600 text-xl font-bold text-white">
                                    {initial}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="truncate font-semibold text-neutral-900 dark:text-white">
                                      {displayName}
                                    </h3>
                                    {profile?.username && (
                                      <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">
                                        @{profile.username}
                                      </p>
                                    )}
                                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                      Enviada {new Date(request.sentAt).toLocaleDateString()}
                                    </p>
                                    <button
                                      onClick={() => handleCancelRequest(request.id)}
                                      className="mt-4 w-full rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
                                    >
                                      Cancelar solicitud
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}

                    {activeTab === 'suggestions' &&
                      (isLoading ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <div
                              key={i}
                              className="h-64 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800"
                            />
                          ))}
                        </div>
                      ) : visibleSuggestions.length === 0 ? (
                        <div className="py-16 text-center">
                          <p className="text-neutral-500 dark:text-neutral-400">
                            No hay sugerencias disponibles
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                            {visibleSuggestions.map((suggestion) => (
                              <SuggestionCard
                                key={suggestion.id}
                                suggestion={suggestion}
                                onSendRequest={(userId) => sendFriendRequest({ addresseeId: userId })}
                                onDismiss={handleDismissSuggestion}
                              />
                            ))}
                          </div>
                          <div className="mt-8 border-t border-neutral-200 pt-8 dark:border-neutral-700">
                            <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
                              Sugerencias rápidas
                            </h3>
                            <FriendSuggestionsCompact limit={6} />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {openChats.map((chat, index) => (
        <ChatBubble
          key={chat.contactId}
          contactId={chat.contactId}
          contactName={chat.contactName}
          contactAvatar={chat.contactAvatar}
          isOnline={false}
          onClose={() => handleCloseChat(chat.contactId)}
          position={index}
        />
      ))}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
        onConfirm={confirmModal.confirmAction}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
