import { create } from 'zustand';
import type { ClubCategory, ClubPrivacy } from '../types/club.types';

interface ClubFilters {
  query: string;
  category?: ClubCategory;
  privacy?: ClubPrivacy;
  verified?: boolean;
  minMembers?: number;
  maxMembers?: number;
  tags: string[];
  sortBy: 'name' | 'members' | 'created' | 'activity';
  sortOrder: 'asc' | 'desc';
}

interface ClubsUIState {
  // Filters
  filters: ClubFilters;
  setFilters: (filters: Partial<ClubFilters>) => void;
  resetFilters: () => void;

  // View mode
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;

  // Active tab
  activeTab: 'mis-clubes' | 'descubrir' | 'sugeridos';
  setActiveTab: (tab: 'mis-clubes' | 'descubrir' | 'sugeridos') => void;

  // Modals
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (isOpen: boolean) => void;
  
  isFiltersModalOpen: boolean;
  setIsFiltersModalOpen: (isOpen: boolean) => void;

  // Search
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;

  // Selected club for actions
  selectedClubId: string | null;
  setSelectedClubId: (id: string | null) => void;
}

const defaultFilters: ClubFilters = {
  query: '',
  category: undefined,
  privacy: undefined,
  verified: undefined,
  minMembers: undefined,
  maxMembers: undefined,
  tags: [],
  sortBy: 'members',
  sortOrder: 'desc',
};

export const useClubsUIStore = create<ClubsUIState>((set) => ({
  // Initial state
  filters: defaultFilters,
  viewMode: 'grid',
  activeTab: 'descubrir',
  isCreateModalOpen: false,
  isFiltersModalOpen: false,
  isSearching: false,
  selectedClubId: null,

  // Actions
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () =>
    set({
      filters: defaultFilters,
    }),

  setViewMode: (mode) =>
    set({
      viewMode: mode,
    }),

  setActiveTab: (tab) =>
    set({
      activeTab: tab,
    }),

  setIsCreateModalOpen: (isOpen) =>
    set({
      isCreateModalOpen: isOpen,
    }),

  setIsFiltersModalOpen: (isOpen) =>
    set({
      isFiltersModalOpen: isOpen,
    }),

  setIsSearching: (isSearching) =>
    set({
      isSearching,
    }),

  setSelectedClubId: (id) =>
    set({
      selectedClubId: id,
    }),
}));
