import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GroupTab } from '../types/group.types';

interface GroupsUIStore {
  // Estado UI
  activeTab: GroupTab;
  searchQuery: string;
  recentlyViewedGroups: string[];
  
  // Acciones
  setActiveTab: (tab: GroupTab) => void;
  setSearchQuery: (query: string) => void;
  clearSearchQuery: () => void;
  addRecentlyViewed: (groupId: string) => void;
  clearRecentlyViewed: () => void;
}

/**
 * Store de Zustand para el estado UI de grupos
 * 
 * Maneja:
 * - Tab activo (mis grupos / descubrir)
 * - Query de búsqueda
 * - Grupos visitados recientemente (persiste en localStorage)
 */
export const useGroupsUIStore = create<GroupsUIStore>()(
  persist(
    (set) => ({
      // Estado inicial
      activeTab: 'my-groups',
      searchQuery: '',
      recentlyViewedGroups: [],

      // Cambiar tab activo
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Actualizar query de búsqueda
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Limpiar búsqueda
      clearSearchQuery: () => set({ searchQuery: '' }),

      // Agregar grupo a visitados recientemente (máximo 10)
      addRecentlyViewed: (groupId) =>
        set((state) => {
          // Eliminar duplicados y agregar al inicio
          const filtered = state.recentlyViewedGroups.filter((id) => id !== groupId);
          return {
            recentlyViewedGroups: [groupId, ...filtered].slice(0, 10),
          };
        }),

      // Limpiar grupos visitados
      clearRecentlyViewed: () => set({ recentlyViewedGroups: [] }),
    }),
    {
      name: 'groups-ui-storage', // key en localStorage
      partialize: (state) => ({
        // Solo persistir grupos visitados, no el tab ni la búsqueda
        recentlyViewedGroups: state.recentlyViewedGroups,
      }),
    }
  )
);
