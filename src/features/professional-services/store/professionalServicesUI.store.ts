
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { ProfessionalServiceFilters } from '../interfaces/professional-service.interfaces'

interface ProfessionalServicesUIState {
  // Active tab
  activeTab: 'my-services' | 'suggested' | 'discover'
  setActiveTab: (tab: 'my-services' | 'suggested' | 'discover') => void

  // Search mode flag (drives hiding the tabs while a search is active).
  isSearching: boolean
  setIsSearching: (searching: boolean) => void

  // Filters — single source of truth for the directory query, including the
  // free-text term (`filters.search`). There is deliberately no parallel
  // `searchQuery` field: the fetch and the filter bar read the same value.
  filters: ProfessionalServiceFilters
  setFilters: (filters: ProfessionalServiceFilters) => void
  clearFilters: () => void

  // View mode
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void

  // Create service modal
  isCreateModalOpen: boolean
  openCreateModal: () => void
  closeCreateModal: () => void

  // Selected service for actions
  selectedServiceId: string | null
  setSelectedServiceId: (serviceId: string | null) => void
}

export const useProfessionalServicesUIStore = create<ProfessionalServicesUIState>()(
  persist(
    (set) => ({
      // Active tab
      activeTab: 'discover',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Search state
      isSearching: false,
      setIsSearching: (searching) => set({ isSearching: searching }),

      // Filters
      filters: {},
      setFilters: (filters) => set({ filters }),
      clearFilters: () => set({ filters: {} }),

      // View mode
      viewMode: 'grid',
      setViewMode: (mode) => set({ viewMode: mode }),

      // Create service modal
      isCreateModalOpen: false,
      openCreateModal: () => set({ isCreateModalOpen: true }),
      closeCreateModal: () => set({ isCreateModalOpen: false }),

      // Selected service
      selectedServiceId: null,
      setSelectedServiceId: (serviceId) => set({ selectedServiceId: serviceId }),
    }),
    {
      name: 'professional-services-ui-storage',
      partialize: (state) => ({
        activeTab: state.activeTab,
        viewMode: state.viewMode,
      }),
    }
  )
)
