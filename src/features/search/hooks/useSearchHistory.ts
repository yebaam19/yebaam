'use client';

import { useState, useCallback } from 'react';
import { useHydrated } from '@/hooks/useHydrated';
import type { SearchHistoryItem, SearchResultType } from '../interfaces/search.interfaces';

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * Hook para manejar el historial de búsquedas
 * Guarda en localStorage las últimas búsquedas del usuario
 * 
 * @example
 * const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();
 */
export function useSearchHistory() {
  const hydrated = useHydrated();
  const [storedHistory, setHistory] = useState<SearchHistoryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) ?? '[]');
      return Array.isArray(parsed) ? parsed.filter((item): item is SearchHistoryItem =>
        typeof item?.id === 'string' && typeof item?.query === 'string' &&
        typeof item?.type === 'string' && typeof item?.timestamp === 'string') : [];
    } catch {
      return [];
    }
  });
  const history = hydrated ? storedHistory : [];

  /**
   * Guardar historial en localStorage
   */
  const saveHistory = useCallback((items: SearchHistoryItem[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(items));
      setHistory(items);
    }
  }, []);

  /**
   * Agregar búsqueda al historial
   */
  const addToHistory = useCallback(
    (query: string, type: SearchResultType = 'all') => {
      if (!query.trim()) return;

      const newItem: SearchHistoryItem = {
        id: `${Date.now()}-${Math.random()}`,
        query: query.trim(),
        type,
        timestamp: new Date().toISOString(),
      };

      // Remover duplicados (misma query)
      const filtered = history.filter(
        (item) => item.query.toLowerCase() !== query.toLowerCase()
      );

      // Agregar al inicio y limitar a MAX_HISTORY_ITEMS
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
      saveHistory(updated);
    },
    [history, saveHistory]
  );

  /**
   * Eliminar ítem del historial
   */
  const removeFromHistory = useCallback(
    (id: string) => {
      const updated = history.filter((item) => item.id !== id);
      saveHistory(updated);
    },
    [history, saveHistory]
  );

  /**
   * Limpiar todo el historial
   */
  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  /**
   * Obtener historial filtrado por tipo
   */
  const getHistoryByType = useCallback(
    (type?: SearchResultType): SearchHistoryItem[] => {
      if (!type || type === 'all') {
        return history;
      }
      return history.filter((item) => item.type === type);
    },
    [history]
  );

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getHistoryByType,
    hasHistory: history.length > 0,
  };
}
