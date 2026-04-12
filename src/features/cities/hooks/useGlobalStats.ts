import { useQuery } from '@tanstack/react-query'
import { cityService } from '../services/city.service'

/**
 * Hook para obtener las estadísticas globales de la plataforma
 * 
 * @returns Query con las estadísticas globales
 * 
 * @example
 * ```tsx
 * const { data: stats, isLoading } = useGlobalStats()
 * 
 * if (isLoading) return <Spinner />
 * 
 * return (
 *   <div>
 *     <p>Ciudades: {stats.totalCities}</p>
 *     <p>Usuarios: {stats.totalUsers}</p>
 *   </div>
 * )
 * ```
 */
export function useGlobalStats() {
  return useQuery({
    queryKey: ['cities', 'stats', 'global'],
    queryFn: () => cityService.getGlobalStats(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  })
}
