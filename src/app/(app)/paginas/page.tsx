'use client';

import { useCallback } from 'react';
import {
  PaginasHeader,
  PaginasTabs,
  SearchResultsHeader,
  PaginasLoadingSkeleton,
  PaginasGrid,
  PaginasEmptyState,
  PagesSearchBar,
  CreatePageModal,
} from '@/features/pages/components';
import { usePagesUIStore } from '@/features/pages/store/pagesUI.store';
import {
  useMyPages,
  useFollowedPages,
  useSuggestedPages,
  useSearchPages,
  useFollowPage,
  useUnfollowPage,
} from '@/features/pages/hooks/usePages';
import type { PageCategory } from '@/features/pages/types/page.types';

export default function PaginasPage() {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    isSearching,
    setIsSearching,
    filters,
    openCreateModal,
  } = usePagesUIStore();

  const { data: myPages, isLoading: isLoadingMy } = useMyPages();
  const { data: followedPages, isLoading: isLoadingFollowed } = useFollowedPages();
  const { data: suggestedPages, isLoading: isLoadingSuggested } = useSuggestedPages();

  const { data: searchResults, isLoading: isSearchLoading } = useSearchPages({
    query: searchQuery,
    category: filters.category as PageCategory | undefined,
    verified: filters.verified,
    location: filters.location,
  });

  const followMutation = useFollowPage();
  const unfollowMutation = useUnfollowPage();

  const handleFollowToggle = useCallback(
    (pageId: string, isFollowing: boolean) => {
      if (isFollowing) {
        unfollowMutation.mutate(pageId);
      } else {
        followMutation.mutate(pageId);
      }
    },
    [followMutation, unfollowMutation],
  );

  const handleSearch = useCallback(
    (query: string) => {
      setIsSearching(!!query || !!filters.category || !!filters.verified);
    },
    [filters.category, filters.verified, setIsSearching],
  );

  const myPagesList = myPages ?? [];
  const followedPagesList = followedPages ?? [];
  const suggestedPagesList = suggestedPages ?? [];

  const getPagesToDisplay = () => {
    if (isSearching && (searchQuery || filters.category || filters.verified)) {
      return searchResults?.pages ?? [];
    }

    switch (activeTab) {
      case 'my-pages':
        return myPagesList;
      case 'followed':
        return followedPagesList;
      case 'discover':
        return suggestedPagesList;
      default: {
        const _exhaustive: never = activeTab;
        void _exhaustive;
        return myPagesList;
      }
    }
  };

  const pagesToDisplay = getPagesToDisplay();

  const isLoading =
    (activeTab === 'my-pages' && isLoadingMy) ||
    (activeTab === 'followed' && isLoadingFollowed) ||
    (activeTab === 'discover' && isLoadingSuggested) ||
    (isSearching && isSearchLoading);

  const isFollowLoading = followMutation.isPending || unfollowMutation.isPending;

  const getEmptyStateType = () => {
    if (isSearching) return 'search' as const;
    return activeTab;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <PaginasHeader onCreateClick={() => openCreateModal()} />
        <PagesSearchBar onSearch={handleSearch} />
      </div>

      {!isSearching && (
        <PaginasTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          myPagesCount={myPagesList.length}
          followedPagesCount={followedPagesList.length}
        />
      )}

      {isSearching && searchResults?.pages && (
        <SearchResultsHeader totalResults={searchResults.pages.length} />
      )}

      {isLoading && <PaginasLoadingSkeleton />}

      {!isLoading && pagesToDisplay.length > 0 && (
        <PaginasGrid
          pages={pagesToDisplay}
          showFollowButton={activeTab !== 'my-pages'}
          onFollowToggle={handleFollowToggle}
          isFollowLoading={isFollowLoading}
        />
      )}

      {!isLoading && pagesToDisplay.length === 0 && (
        <PaginasEmptyState
          type={getEmptyStateType()}
          onCreateClick={() => openCreateModal()}
          onClearSearch={() => {
            setIsSearching(false);
            usePagesUIStore.getState().clearFilters();
          }}
          onDiscoverClick={() => setActiveTab('discover')}
        />
      )}

      <CreatePageModal />
    </div>
  );
}
