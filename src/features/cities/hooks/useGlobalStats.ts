'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { cityService } from '../services/city.service';

/**
 * Hook para obtener las estadísticas globales de la plataforma
 */
export function useGlobalStats() {
  return useFetch(
    ['cities', 'stats', 'global'],
    () => cityService.getGlobalStats(),
    { staleTime: 1000 * 60 * 5 }
  );
}
