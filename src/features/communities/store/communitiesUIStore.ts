import { create } from 'zustand';
import { CommunityCategory, CommunityPrivacy } from '../types/community.types';

/**
 * UI State for Communities feature
 */
interface CommunitiesUIState {
  // Filters
  filters: {
    query: string;
    category?: CommunityCategory;
    privacy?: CommunityPrivacy;
    verified?: boolean;
    minMembers?: number;
    maxMembers?: number;
    tags: string[];
    location?: string;
    sortBy: 'members' | 'activity' | 'growth' | 'recent';
    sortOrder: 'asc' | 'desc';
  };

  // View mode
  viewMode: 'grid' | 'list';

  // Active tab
  activeTab: 'descubrir' | 'mis-comunidades' | 'sugeridas';

  // Modal states
  showCreateModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;

  // Search state
  isSearching: boolean;

  // Selected community
  selectedCommunityId: string | null;

  // Actions
  setFilters: (filters: Partial<CommunitiesUIState['filters']>) => void;
  resetFilters: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setActiveTab: (tab: CommunitiesUIState['activeTab']) => void;
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowDeleteModal: (show: boolean) => void;
  setIsSearching: (searching: boolean) => void;
  setSelectedCommunityId: (id: string | null) => void;
}

/**
 * Default filters
 */
const defaultFilters: CommunitiesUIState['filters'] = {
  query: '',
  category: undefined,
  privacy: undefined,
  verified: undefined,
  minMembers: undefined,
  maxMembers: undefined,
  tags: [],
  location: undefined,
  sortBy: 'members',
  sortOrder: 'desc',
};

/**
 * Zustand store for Communities UI state
 */
export const useCommunitiesUIStore = create<CommunitiesUIState>((set) => ({
  // Initial state
  filters: defaultFilters,
  viewMode: 'grid',
  activeTab: 'descubrir',
  showCreateModal: false,
  showEditModal: false,
  showDeleteModal: false,
  isSearching: false,
  selectedCommunityId: null,

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

  setShowCreateModal: (show) =>
    set({
      showCreateModal: show,
    }),

  setShowEditModal: (show) =>
    set({
      showEditModal: show,
    }),

  setShowDeleteModal: (show) =>
    set({
      showDeleteModal: show,
    }),

  setIsSearching: (searching) =>
    set({
      isSearching: searching,
    }),

  setSelectedCommunityId: (id) =>
    set({
      selectedCommunityId: id,
    }),
}));
