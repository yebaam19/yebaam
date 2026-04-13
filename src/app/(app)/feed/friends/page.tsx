'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { FriendCard } from '@/features/user/components/FriendCard';
import { FriendRequestCard } from '@/features/user/components/FriendRequestCard';
import { SuggestionCard } from '@/features/user/components/SuggestionCard';
import { FriendSuggestionsCompact } from '@/features/user/components/FriendSuggestionCard';
import { useFriendships } from '@/features/friendships';
import ChatBubble from '@/components/chat/ChatBubble';
import { FriendsStats, FriendsTabs, SearchBar, ConfirmModal, type TabType } from './components';

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

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('friends');
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

  // Handlers con modales de confirmación
  const handleToggleCloseFriend = async (friendId: string) => {
    const friend = friends?.find(f => f.friendId === friendId);
    if (!friend) return;
    await updateFriendConfig(friendId, { closeFriend: !friend.closeFriend });
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    const friend = friends?.find(f => f.friendshipId === friendshipId);
    const friendName = friend ? `${friend.firstName} ${friend.lastName}` : 'esta persona';
    
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar amigo',
      message: `¿Estás seguro de que quieres eliminar a ${friendName} de tu lista de amigos?`,
      confirmText: 'Eliminar',
      type: 'danger',
      confirmAction: async () => {
        await removeFriend(friendshipId);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
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
        friend.firstName && friend.lastName
          ? `${friend.firstName} ${friend.lastName}`
          : friend.username;
      return [
        ...next,
        { contactId: friendId, contactName: name, contactAvatar: friend.avatar || '' },
      ];
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
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Placeholder para el mensaje de búsqueda
  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'friends': return 'Buscar amigos...';
      case 'requests': return 'Buscar solicitudes...';
      case 'sent': return 'Buscar enviadas...';
      case 'suggestions': return 'Buscar sugerencias...';
      default: return 'Buscar...';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header con título */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            Amigos
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Gestiona tus conexiones y descubre nuevas amistades
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Estadísticas */}
        <FriendsStats
          totalFriends={stats.totalFriends}
          closeFriends={stats.closeFriends}
          pendingRequests={stats.pendingRequests}
          sentRequests={stats.sentRequests}
          suggestions={stats.suggestions}
        />

        {/* Tabs de navegación */}
        <FriendsTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingCount={pendingCount}
          sentCount={sentRequests?.length || 0}
        />

        {/* Barra de búsqueda */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={getSearchPlaceholder()}
        />

        {/* Contenido de tabs */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 min-h-96 p-6">
          {/* Tab: Amigos */}
          {activeTab === 'friends' && (
            isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-neutral-100 dark:bg-neutral-800 h-48 rounded-xl" />
                ))}
              </div>
            ) : !friends || friends.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-neutral-500 dark:text-neutral-400">
                  No tienes amigos aún. Explora las sugerencias para conectar con otros usuarios.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            )
          )}

          {/* Tab: Solicitudes recibidas */}
          {activeTab === 'requests' && (
            isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-neutral-100 dark:bg-neutral-800 h-64 rounded-xl" />
                ))}
              </div>
            ) : !pendingRequests || pendingRequests.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-neutral-500 dark:text-neutral-400">
                  No tienes solicitudes pendientes
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingRequests.map((request) => (
                  <FriendRequestCard
                    key={request.id}
                    request={{
                      requestId: request.id,
                      fromUserId: request.requesterId,
                      message: request.message,
                      sentAt: request.sentAt,
                      status: request.status as 'pending' | 'accepted' | 'rejected',
                      profile: request.profile || request.senderProfile || {
                        id: request.requesterId,
                        username: `user_${request.requesterId.slice(0, 8)}`,
                        firstName: 'Usuario',
                        lastName: request.requesterId.slice(0, 8),
                        avatar: undefined,
                      }
                    }}
                    onAccept={acceptFriendRequest}
                    onReject={rejectFriendRequest}
                  />
                ))}
              </div>
            )
          )}

          {/* Tab: Solicitudes enviadas */}
          {activeTab === 'sent' && (
            isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-neutral-100 dark:bg-neutral-800 h-64 rounded-xl" />
                ))}
              </div>
            ) : !sentRequests || sentRequests.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-neutral-500 dark:text-neutral-400">
                  No has enviado solicitudes
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sentRequests.map((request) => {
                  // Intentar obtener el perfil del destinatario
                  const profile = request.profile || request.recipientProfile;
                  
                  const displayName = profile 
                    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.username
                    : `${request.addresseeId?.slice(0, 8)}`;
                  
                  const initial = profile?.firstName?.charAt(0)?.toUpperCase() 
                    || profile?.username?.charAt(0)?.toUpperCase() 
                    || request.addresseeId?.charAt(0)?.toUpperCase() 
                    || '?';
                  
                  return (
                    <div
                      key={`sent-${request.id}-${Date.now()}`}
                      className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl">
                          {initial}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-900 dark:text-white">
                            {displayName}
                          </h3>
                          {profile?.username && (
                            <p className="text-xs text-neutral-400 dark:text-neutral-500">
                              @{profile.username}
                            </p>
                          )}
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Enviada {new Date(request.sentAt).toLocaleDateString()}
                          </p>
                          <button
                            onClick={() => handleCancelRequest(request.id)}
                            className="mt-4 w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors font-medium text-sm"
                          >
                            Cancelar solicitud
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Tab: Sugerencias */}
          {activeTab === 'suggestions' && (
            isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-neutral-100 dark:bg-neutral-800 h-64 rounded-xl" />
                ))}
              </div>
            ) : visibleSuggestions.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-neutral-500 dark:text-neutral-400">
                  No hay sugerencias disponibles
                </p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {visibleSuggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      onSendRequest={(userId) => sendFriendRequest({ addresseeId: userId })}
                      onDismiss={handleDismissSuggestion}
                    />
                  ))}
                </div>
                <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-700">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                    Sugerencias rápidas
                  </h3>
                  <FriendSuggestionsCompact limit={6} />
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Chat bubbles */}
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

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
        onConfirm={confirmModal.confirmAction}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
