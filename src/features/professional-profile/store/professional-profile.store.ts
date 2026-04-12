/**
 * Professional Profile Store (DEPRECATED)
 *
 * Store de Zustand SIMPLIFICADO solo para estado UI local.
 * Toda la lógica de fetching/mutations ahora está en React Query.
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface ProfessionalProfileUIState {
  isCreateDialogOpen: boolean
  activeTab: string
  selectedSection: string | null
  
  openCreateDialog: () => void
  closeCreateDialog: () => void
  setActiveTab: (tab: string) => void
  setSelectedSection: (section: string | null) => void
  reset: () => void
}

export const useProfessionalProfileStore = create<ProfessionalProfileUIState>()(
  devtools(
    (set) => ({
      isCreateDialogOpen: false,
      activeTab: 'overview',
      selectedSection: null,

      openCreateDialog: () => set({ isCreateDialogOpen: true }),
      closeCreateDialog: () => set({ isCreateDialogOpen: false }),
      setActiveTab: (tab: string) => set({ activeTab: tab }),
      setSelectedSection: (section: string | null) => set({ selectedSection: section }),
      
      reset: () =>
        set({
          isCreateDialogOpen: false,
          activeTab: 'overview',
          selectedSection: null,
        }),
    }),
    { name: 'professional-profile-ui-store' }
  )
)
