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
import { MockDataBanner } from '@/features/pages/components/MockDataBanner';
import { usePagesUIStore } from '@/features/pages/store/pagesUI.store';
import {
  useMyPages,
  useFollowedPages,
  useSuggestedPages,
  useSearchPages,
  useFollowPage,
  useUnfollowPage,
} from '@/features/pages/hooks/usePages';
// MOCK DATA - Comentar cuando el backend esté listo
import { useMockPages } from '@/features/pages/hooks/useMockPages';

export default function PaginasPage() {
  // MOCK DATA - Descomentar las líneas de abajo cuando el backend esté listo
  const mockHooks = useMockPages();
  const USE_MOCKS = mockHooks.USE_MOCK_DATA;

  const {
    activeTab,
    setActiveTab,
    searchQuery,
    isSearching,
    setIsSearching,
    filters,
    openCreateModal,
  } = usePagesUIStore();

  // Queries - Cambiar entre mock y real
  const { data: myPages = [], isLoading: isLoadingMy } = USE_MOCKS
    ? mockHooks.useMyPagesMock()
    : useMyPages();
  const { data: followedPages = [], isLoading: isLoadingFollowed } = USE_MOCKS
    ? mockHooks.useFollowedPagesMock()
    : useFollowedPages();
  const { data: suggestedPages = [], isLoading: isLoadingSuggested } = USE_MOCKS
    ? mockHooks.useSuggestedPagesMock()
    : useSuggestedPages();

  // Search
  const {
    data: searchResults,
    isLoading: isSearchLoading,
  } = USE_MOCKS
    ? mockHooks.useSearchPagesMock({
        query: searchQuery,
        category: filters.category,
        verified: filters.verified,
        location: filters.location,
      })
    : useSearchPages({
        query: searchQuery,
        category: filters.category as any,
        verified: filters.verified,
        location: filters.location,
      });

  // Mutations
  const followMutation = USE_MOCKS ? mockHooks.useFollowPageMock() : useFollowPage();
  const unfollowMutation = USE_MOCKS ? mockHooks.useUnfollowPageMock() : useUnfollowPage();

  const handleFollowToggle = useCallback((pageId: string, isFollowing: boolean) => {
    if (isFollowing) {
      unfollowMutation.mutate(pageId);
    } else {
      followMutation.mutate(pageId);
    }
  }, [followMutation, unfollowMutation]);

  const handleSearch = useCallback((query: string) => {
    setIsSearching(!!query || !!filters.category || !!filters.verified);
  }, [filters.category, filters.verified, setIsSearching]);

  // Determinar qué páginas mostrar
  const getPagesToDisplay = () => {
    if (isSearching && (searchQuery || filters.category || filters.verified)) {
      return searchResults?.pages || [];
    }

    switch (activeTab) {
      case 'my-pages':
        return myPages;
      case 'followed':
        return followedPages;
      case 'discover':
        return suggestedPages;
      default:
        return myPages;
    }
  };

  const pagesToDisplay = getPagesToDisplay();

  const isLoading =
    (activeTab === 'my-pages' && isLoadingMy) ||
    (activeTab === 'followed' && isLoadingFollowed) ||
    (activeTab === 'discover' && isLoadingSuggested) ||
    (isSearching && isSearchLoading);

  const isFollowLoading = followMutation.isPending || unfollowMutation.isPending;

  // Determinar tipo de empty state
  const getEmptyStateType = () => {
    if (isSearching) return 'search';
    return activeTab as 'my-pages' | 'followed' | 'discover';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <PaginasHeader onCreateClick={() => openCreateModal()} />
        <PagesSearchBar onSearch={handleSearch} />
      </div>

      {/* Tabs */}
      {!isSearching && (
        <PaginasTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          myPagesCount={myPages.length}
          followedPagesCount={followedPages.length}
        />
      )}

      {/* Search Results Header */}
      {isSearching && searchResults?.pages && (
        <SearchResultsHeader totalResults={searchResults.pages.length} />
      )}

      {/* Loading State */}
      {isLoading && <PaginasLoadingSkeleton />}

      {/* Pages Grid */}
      {!isLoading && pagesToDisplay.length > 0 && (
        <PaginasGrid
          pages={pagesToDisplay}
          showFollowButton={activeTab !== 'my-pages'}
          onFollowToggle={handleFollowToggle}
          isFollowLoading={isFollowLoading}
        />
      )}

      {/* Empty States */}
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

      {/* Modal de creación */}
      <CreatePageModal />

      {/* Banner de modo mock */}
      {USE_MOCKS && <MockDataBanner />}
    </div>
  );
}
