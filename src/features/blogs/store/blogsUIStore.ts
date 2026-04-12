import { create } from 'zustand';
import type { BlogCategory } from '../types/blog.types';

interface BlogFilters {
  query: string;
  category?: BlogCategory;
  tags: string[];
  verified?: boolean;
  minFollowers?: number;
  sortBy: 'name' | 'followers' | 'posts' | 'views' | 'created';
  sortOrder: 'asc' | 'desc';
}

interface BlogsUIState {
  filters: BlogFilters;
  setFilters: (filters: Partial<BlogFilters>) => void;
  resetFilters: () => void;

  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;

  activeTab: 'descubrir' | 'mis-blogs' | 'siguiendo';
  setActiveTab: (tab: 'descubrir' | 'mis-blogs' | 'siguiendo') => void;

  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;

  selectedBlogId: string | null;
  setSelectedBlogId: (id: string | null) => void;
}

const defaultFilters: BlogFilters = {
  query: '',
  category: undefined,
  tags: [],
  verified: undefined,
  minFollowers: undefined,
  sortBy: 'followers',
  sortOrder: 'desc',
};

export const useBlogsUIStore = create<BlogsUIState>((set) => ({
  filters: defaultFilters,
  viewMode: 'grid',
  activeTab: 'descubrir',
  isSearching: false,
  selectedBlogId: null,

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

  setIsSearching: (isSearching) =>
    set({
      isSearching,
    }),

  setSelectedBlogId: (id) =>
    set({
      selectedBlogId: id,
    }),
}));
