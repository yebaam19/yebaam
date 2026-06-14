'use client';

import { useTranslations } from 'next-intl';
import ChatBubble from '@/components/chat/ChatBubble';
import { FriendsTabView, RequestsTabView, SentTabView, SuggestionsTabView } from './tabs';
import { FriendsStats, FriendsTabs, SearchBar, ConfirmModal } from './components';
import { FriendsHero } from './components/FriendsHero';
import { ProfileProgress } from './components/ProfileProgress';
import { SuggestedPeopleRail } from './components/SuggestedPeopleRail';
import { RecentActivity } from './components/RecentActivity';
import { ChevronDownIcon } from '@/components/icons/heroicons-shim';
import { useFriendsManager } from './useFriendsManager';

export default function FriendsPage() {
  const t = useTranslations('feed');
  const {
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
  } = useFriendsManager();

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
                  {t('friends.advancedManager.title')}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('friends.advancedManager.subtitle')}
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
                    {activeTab === 'friends' && (
                      <FriendsTabView
                        isLoading={isLoading}
                        friends={friends}
                        onToggleCloseFriend={handleToggleCloseFriend}
                        onRemove={handleRemoveFriend}
                        onChat={handleOpenChat}
                      />
                    )}

                    {activeTab === 'requests' && (
                      <RequestsTabView
                        isLoading={isLoading}
                        pendingRequests={pendingRequests}
                        onAccept={acceptFriendRequest}
                        onReject={rejectFriendRequest}
                      />
                    )}

                    {activeTab === 'sent' && (
                      <SentTabView
                        isLoading={isLoading}
                        sentRequests={sentRequests}
                        onCancel={handleCancelRequest}
                      />
                    )}

                    {activeTab === 'suggestions' && (
                      <SuggestionsTabView
                        isLoading={isLoading}
                        suggestions={visibleSuggestions}
                        onSendRequest={(userId) => sendFriendRequest({ addresseeId: userId })}
                        onDismiss={handleDismissSuggestion}
                      />
                    )}
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
