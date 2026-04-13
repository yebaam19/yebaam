'use client';

/**
 * Mock Hooks para Servicios Profesionales (native, no TanStack)
 */

import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { invalidate } from '@/lib/hooks/cacheStore';

import {
  MOCK_CITIES,
  MOCK_PROFESSIONAL_SERVICES_BASIC,
  MOCK_STATES,
  SERVICE_CATEGORIES,
} from '../data/mock-professional-services';
import {
  CreateProfessionalServiceDTO,
  ProfessionalServiceBasic,
  ProfessionalServiceFilters,
} from '../interfaces/professional-service.interfaces';

const USE_MOCK_DATA = true;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const CURRENT_USER_ID = 'user-srv-1';

const toBasicService = (service: ProfessionalServiceBasic): ProfessionalServiceBasic => ({
  ...service,
});

export const useMockProfessionalServices = () => {
  const useMyServicesMock = () => {
    return useFetch(
      ['professional-services', 'my-services'],
      async () => {
        await delay(800);
        return MOCK_PROFESSIONAL_SERVICES_BASIC.filter(
          (service) => service.user?.id === CURRENT_USER_ID
        ).map(toBasicService);
      },
      { enabled: USE_MOCK_DATA }
    );
  };

  const useSuggestedServicesMock = () => {
    return useFetch(
      ['professional-services', 'suggested'],
      async () => {
        await delay(600);
        return MOCK_PROFESSIONAL_SERVICES_BASIC.filter(
          (service) => service.user?.id !== CURRENT_USER_ID
        )
          .sort(() => Math.random() - 0.5)
          .slice(0, 6)
          .map(toBasicService);
      },
      { enabled: USE_MOCK_DATA }
    );
  };

  const useDiscoverServicesMock = () => {
    return useFetch(
      ['professional-services', 'discover'],
      async () => {
        await delay(700);
        return MOCK_PROFESSIONAL_SERVICES_BASIC.map(toBasicService);
      },
      { enabled: USE_MOCK_DATA }
    );
  };

  const useSearchServicesMock = (params: ProfessionalServiceFilters) => {
    return useFetch(
      ['professional-services', 'search', JSON.stringify(params)],
      async () => {
        await delay(500);
        let results = [...MOCK_PROFESSIONAL_SERVICES_BASIC];

        if (params.search) {
          const query = params.search.toLowerCase();
          results = results.filter(
            (service) =>
              service.name.toLowerCase().includes(query) ||
              service.description?.toLowerCase().includes(query) ||
              service.category.name.toLowerCase().includes(query)
          );
        }

        if (params.categoryId) {
          results = results.filter((service) => service.category.id === params.categoryId);
        }

        if (params.cityId) {
          results = results.filter((service) => service.city?.id === params.cityId);
        }

        if (params.stateId) {
          const citiesInState = MOCK_CITIES.filter(
            (city) => city.stateId === params.stateId
          ).map((c) => c.id);
          results = results.filter(
            (service) => service.city?.id && citiesInState.includes(service.city.id)
          );
        }

        if (params.availableForHire !== undefined) {
          results = results.filter(
            (service) => service.availableForHire === params.availableForHire
          );
        }

        return {
          services: results.map(toBasicService),
          total: results.length,
          page: params.page || 1,
          limit: params.limit || 12,
          totalPages: Math.ceil(results.length / (params.limit || 12)),
        };
      },
      {
        enabled:
          USE_MOCK_DATA &&
          !!(params.search || params.categoryId || params.cityId || params.stateId),
      }
    );
  };

  const useCreateServiceMock = () => {
    return useAsyncAction(
      async (data: CreateProfessionalServiceDTO) => {
        await delay(1500);
        const category = SERVICE_CATEGORIES.find((c) => c.id === data.categoryId);
        const city = MOCK_CITIES.find((c) => c.id === data.cityId);

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
            ? { id: city.id, name: city.name, slug: city.slug }
            : undefined,
          user: {
            id: CURRENT_USER_ID,
            username: 'current_user',
            firstName: 'Usuario',
            lastName: 'Actual',
          },
          _count: { reviews: 0, media: 0 },
          averageRating: undefined,
        };
        return newService;
      },
      {
        onSuccess: () => {
          invalidate('professional-services');
        },
      }
    );
  };

  const useUpdateServiceMock = () => {
    return useAsyncAction(
      async ({ id, data }: { id: string; data: Partial<CreateProfessionalServiceDTO> }) => {
        await delay(1000);
        return { id, ...data };
      },
      {
        onSuccess: () => {
          invalidate('professional-services');
        },
      }
    );
  };

  const useDeleteServiceMock = () => {
    return useAsyncAction(
      async (serviceId: string) => {
        await delay(800);
        return { success: true, id: serviceId };
      },
      {
        onSuccess: () => {
          invalidate('professional-services');
        },
      }
    );
  };

  return {
    USE_MOCK_DATA,
    useMyServicesMock,
    useSuggestedServicesMock,
    useDiscoverServicesMock,
    useSearchServicesMock,
    useCreateServiceMock,
    useUpdateServiceMock,
    useDeleteServiceMock,
    states: MOCK_STATES,
    cities: MOCK_CITIES,
    categories: SERVICE_CATEGORIES,
  };
};
