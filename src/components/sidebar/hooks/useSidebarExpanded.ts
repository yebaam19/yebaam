'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect, useState } from 'react';

interface SidebarExpandedState {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;
}

const useSidebarExpandedStore = create<SidebarExpandedState>()(
  persist(
    (set) => ({
      isExpanded: false,
      setIsExpanded: (expanded) => set({ isExpanded: expanded }),
      toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
    }),
    {
      name: 'sidebar-expanded-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

/**
 * Hook para controlar el estado expandido del menú (Ver más)
 * Con hidratación correcta para evitar hydration mismatch
 */
export function useSidebarExpanded() {
  const [isHydrated, setIsHydrated] = useState(false);
  const store = useSidebarExpandedStore();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return {
    isExpanded: isHydrated ? store.isExpanded : false,
    setIsExpanded: store.setIsExpanded,
    toggleExpanded: store.toggleExpanded,
  };
}
