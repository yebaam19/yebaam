/**
 * Businesses UI Store
 *
 * Store de Zustand para manejar el estado de la UI
 * de negocios (tabs, modales, filtros, etc.)
 */

import { create } from 'zustand'

export type BusinessTabType = 'my-businesses' | 'suggested' | 'discover'

interface BusinessFiltersState {
  search: string
  categoryId: string | null
  stateId: string | null
  cityId: string | null
}

interface BusinessesUIState {
  // Tabs
  activeTab: BusinessTabType
  setActiveTab: (tab: BusinessTabType) => void

  // Modal de creación
  isCreateModalOpen: boolean
  openCreateModal: () => void
  closeCreateModal: () => void
  setCreateModalOpen: (open: boolean) => void

  // Filtros
  filters: BusinessFiltersState
  setFilters: (filters: BusinessFiltersState) => void
  setSearch: (search: string) => void
  setCategoryId: (categoryId: string | null) => void
  setStateId: (stateId: string | null) => void
  setCityId: (cityId: string | null) => void
  resetFilters: () => void
}

const initialFilters: BusinessFiltersState = {
  search: '',
  categoryId: null,
  stateId: null,
  cityId: null,
}

export const useBusinessesUIStore = create<BusinessesUIState>((set) => ({
  // Tabs
  activeTab: 'discover',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Modal de creación
  isCreateModalOpen: false,
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),

  // Filtros
  filters: initialFilters,
  setFilters: (filters) => set({ filters }),
  setSearch: (search) => set((state) => ({ filters: { ...state.filters, search } })),
  setCategoryId: (categoryId) =>
    set((state) => ({
      filters: { ...state.filters, categoryId },
    })),
  setStateId: (stateId) =>
    set((state) => ({
      filters: { ...state.filters, stateId, cityId: null },
    })),
  setCityId: (cityId) =>
    set((state) => ({
      filters: { ...state.filters, cityId },
    })),
  resetFilters: () => set({ filters: initialFilters }),
}))
