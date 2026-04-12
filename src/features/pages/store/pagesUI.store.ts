import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PagesFilters {
  category?: string;
  verified?: boolean;
  location?: string;
}

interface PagesUIState {
  // Active tab
  activeTab: 'my-pages' | 'followed' | 'discover';
  setActiveTab: (tab: 'my-pages' | 'followed' | 'discover') => void;

  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;

  // Filters
  filters: PagesFilters;
  setFilters: (filters: PagesFilters) => void;
  clearFilters: () => void;

  // View mode
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;

  // Create page modal
  isCreateModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;

  // Selected page for actions
  selectedPageId: string | null;
  setSelectedPageId: (pageId: string | null) => void;
}

export const usePagesUIStore = create<PagesUIState>()(
  persist(
    (set) => ({
      // Active tab
      activeTab: 'my-pages',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Search state
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      isSearching: false,
      setIsSearching: (searching) => set({ isSearching: searching }),

      // Filters
      filters: {},
      setFilters: (filters) => set({ filters }),
      clearFilters: () => set({ filters: {}, searchQuery: '' }),

      // View mode
      viewMode: 'grid',
      setViewMode: (mode) => set({ viewMode: mode }),

      // Create page modal
      isCreateModalOpen: false,
      openCreateModal: () => set({ isCreateModalOpen: true }),
      closeCreateModal: () => set({ isCreateModalOpen: false }),

      // Selected page
      selectedPageId: null,
      setSelectedPageId: (pageId) => set({ selectedPageId: pageId }),
    }),
    {
      name: 'pages-ui-storage',
      partialize: (state) => ({
        activeTab: state.activeTab,
        viewMode: state.viewMode,
      }),
    }
  )
);
