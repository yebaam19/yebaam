'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useHydrated } from '@/hooks/useHydrated';

interface SidebarState {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
    }),
    {
      name: 'sidebar-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * Hook para controlar el estado del sidebar
 * Con hidratación correcta para evitar hydration mismatch
 */
export function useSidebar() {
  const isHydrated = useHydrated();
  const store = useSidebarStore();


  return {
    isCollapsed: isHydrated ? store.isCollapsed : false,
    setIsCollapsed: store.setIsCollapsed,
    toggleCollapsed: store.toggleCollapsed,
  };
}
