/**
 * Mock Hooks para Servicios Profesionales
 *
 * Hooks con datos mock para desarrollo y testing.
 * Cambiar USE_MOCK_DATA a false cuando el backend esté listo.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  MOCK_CITIES,
  MOCK_PROFESSIONAL_SERVICES_BASIC,
  MOCK_STATES,
  SERVICE_CATEGORIES,
} from '../data/mock-professional-services'
import {
  CreateProfessionalServiceDTO,
  ProfessionalServiceBasic,
  ProfessionalServiceFilters,
} from '../interfaces/professional-service.interfaces'

// Flag para activar/desactivar mocks
const USE_MOCK_DATA = true

// Simular delay de red
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ID del usuario actual mockeado
const CURRENT_USER_ID = 'user-srv-1'

// Convertir servicio completo a básico para el mock
const toBasicService = (service: ProfessionalServiceBasic): ProfessionalServiceBasic => ({
  ...service,
})

export const useMockProfessionalServices = () => {
  const queryClient = useQueryClient()

  // Query: Mis servicios (del usuario actual)
  const useMyServicesMock = () => {
    return useQuery({
      queryKey: ['professional-services', 'my-services'],
      queryFn: async () => {
        await delay(800)
        // Filtrar servicios del usuario actual
        return MOCK_PROFESSIONAL_SERVICES_BASIC.filter((service) => service.user?.id === CURRENT_USER_ID).map(
          toBasicService
        )
      },
      enabled: USE_MOCK_DATA,
    })
  }

  // Query: Servicios sugeridos (basados en categorías populares)
  const useSuggestedServicesMock = () => {
    return useQuery({
      queryKey: ['professional-services', 'suggested'],
      queryFn: async () => {
        await delay(600)
        // Retornar servicios aleatorios como sugerencias
        return MOCK_PROFESSIONAL_SERVICES_BASIC.filter((service) => service.user?.id !== CURRENT_USER_ID)
          .sort(() => Math.random() - 0.5)
          .slice(0, 6)
          .map(toBasicService)
      },
      enabled: USE_MOCK_DATA,
    })
  }

  // Query: Descubrir servicios (todos los servicios)
  const useDiscoverServicesMock = () => {
    return useQuery({
      queryKey: ['professional-services', 'discover'],
      queryFn: async () => {
        await delay(700)
        return MOCK_PROFESSIONAL_SERVICES_BASIC.map(toBasicService)
      },
      enabled: USE_MOCK_DATA,
    })
  }

  // Query: Buscar servicios
  const useSearchServicesMock = (params: ProfessionalServiceFilters) => {
    return useQuery({
      queryKey: ['professional-services', 'search', params],
      queryFn: async () => {
        await delay(500)
        let results = [...MOCK_PROFESSIONAL_SERVICES_BASIC]

        // Filtrar por query
        if (params.search) {
          const query = params.search.toLowerCase()
          results = results.filter(
            (service) =>
              service.name.toLowerCase().includes(query) ||
              service.description?.toLowerCase().includes(query) ||
              service.category.name.toLowerCase().includes(query)
          )
        }

        // Filtrar por categoría
        if (params.categoryId) {
          results = results.filter((service) => service.category.id === params.categoryId)
        }

        // Filtrar por ciudad
        if (params.cityId) {
          results = results.filter((service) => service.city?.id === params.cityId)
        }

        // Filtrar por estado (a través de la ciudad)
        if (params.stateId) {
          const citiesInState = MOCK_CITIES.filter((city) => city.stateId === params.stateId).map((c) => c.id)
          results = results.filter((service) => service.city?.id && citiesInState.includes(service.city.id))
        }

        // Filtrar por disponibilidad
        if (params.availableForHire !== undefined) {
          results = results.filter((service) => service.availableForHire === params.availableForHire)
        }

        return {
          services: results.map(toBasicService),
          total: results.length,
          page: params.page || 1,
          limit: params.limit || 12,
          totalPages: Math.ceil(results.length / (params.limit || 12)),
        }
      },
      enabled: USE_MOCK_DATA && !!(params.search || params.categoryId || params.cityId || params.stateId),
    })
  }

  // Mutation: Crear servicio
  const useCreateServiceMock = () => {
    return useMutation({
      mutationFn: async (data: CreateProfessionalServiceDTO) => {
        await delay(1500)

        const category = SERVICE_CATEGORIES.find((c) => c.id === data.categoryId)
        const city = MOCK_CITIES.find((c) => c.id === data.cityId)

        const newService: ProfessionalServiceBasic = {
          id: `srv-mock-${Date.now()}`,
          name: data.name,
          slug: data.name.toLowerCase().replace(/\s+/g, '-'),
          description: data.description,
          address: data.address,
          hourlyRate: data.hourlyRate,
          currency: data.currency || 'COP',
          availableForHire: data.availableForHire ?? true,
          category: category || SERVICE_CATEGORIES[0],
          city: city
            ? {
                id: city.id,
                name: city.name,
                slug: city.slug,
              }
            : undefined,
          user: {
            id: CURRENT_USER_ID,
            username: 'current_user',
            firstName: 'Usuario',
            lastName: 'Actual',
          },
          _count: {
            reviews: 0,
            media: 0,
          },
          averageRating: undefined,
        }

        return newService
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['professional-services'] })
      },
    })
  }

  // Mutation: Editar servicio
  const useUpdateServiceMock = () => {
    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: Partial<CreateProfessionalServiceDTO> }) => {
        await delay(1000)
        return { id, ...data }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['professional-services'] })
      },
    })
  }

  // Mutation: Eliminar servicio
  const useDeleteServiceMock = () => {
    return useMutation({
      mutationFn: async (serviceId: string) => {
        await delay(800)
        return { success: true, id: serviceId }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['professional-services'] })
      },
    })
  }

  return {
    USE_MOCK_DATA,
    useMyServicesMock,
    useSuggestedServicesMock,
    useDiscoverServicesMock,
    useSearchServicesMock,
    useCreateServiceMock,
    useUpdateServiceMock,
    useDeleteServiceMock,
    // Datos estáticos para filtros
    states: MOCK_STATES,
    cities: MOCK_CITIES,
    categories: SERVICE_CATEGORIES,
  }
}
