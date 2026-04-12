'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect, useState } from 'react';

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
  const [isHydrated, setIsHydrated] = useState(false);
  const store = useSidebarStore();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return {
    isCollapsed: isHydrated ? store.isCollapsed : false,
    setIsCollapsed: store.setIsCollapsed,
    toggleCollapsed: store.toggleCollapsed,
  };
}
