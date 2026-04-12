
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ServicesFilters {
  search?: string
  categoryId?: string
  stateId?: string
  cityId?: string
  availableForHire?: boolean
}

interface ProfessionalServicesUIState {
  // Active tab
  activeTab: 'my-services' | 'suggested' | 'discover'
  setActiveTab: (tab: 'my-services' | 'suggested' | 'discover') => void

  // Search state
  searchQuery: string
  setSearchQuery: (query: string) => void
  isSearching: boolean
  setIsSearching: (searching: boolean) => void

  // Filters
  filters: ServicesFilters
  setFilters: (filters: ServicesFilters) => void
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
