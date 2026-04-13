import {
  BusinessBasic,
  BusinessCategory,
  BusinessDetailResponse,
  BusinessesListResponse,
  BusinessFilters,
  City,
  LocationFiltersData,
  State,
} from '../interfaces/business.interfaces';

const API_BASE = '/api/businesses';

type JsonRecord = Record<string, unknown>;

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'same-origin',
  });
  if (response.status === 404) return null;
  const payload = (await response.json().catch(() => ({}))) as JsonRecord;
  if (!response.ok) {
    const message = (payload as { error?: string }).error || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

class BusinessService {
  async getBusinessById(id: string): Promise<BusinessDetailResponse | null> {
    return jsonFetch<BusinessDetailResponse>(`${API_BASE}/${id}`);
  }

  async getBusinessBySlug(slug: string): Promise<BusinessDetailResponse | null> {
    return jsonFetch<BusinessDetailResponse>(`${API_BASE}/${slug}`);
  }

  async getBusinesses(filters: BusinessFilters = {}): Promise<BusinessesListResponse> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.cityId) params.append('cityId', filters.cityId);
    if (filters.stateId) params.append('stateId', filters.stateId);
    if (filters.minRating !== undefined) params.append('minRating', filters.minRating.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const data = await jsonFetch<BusinessesListResponse>(`${API_BASE}?${params.toString()}`);
    return (
      data ??
      ({
        businesses: [],
        total: 0,
        page: 1,
        limit: filters.limit ?? 20,
        hasMore: false,
      } as unknown as BusinessesListResponse)
    );
  }

  async getBusinessesByCity(
    cityId: string,
    filters: Omit<BusinessFilters, 'cityId'> = {},
  ): Promise<BusinessesListResponse> {
    return this.getBusinesses({ ...filters, cityId });
  }

  async getBusinessesByCategory(
    categoryId: string,
    filters: Omit<BusinessFilters, 'categoryId'> = {},
  ): Promise<BusinessesListResponse> {
    return this.getBusinesses({ ...filters, categoryId });
  }

  async getCategories(): Promise<BusinessCategory[]> {
    const data = await jsonFetch<BusinessCategory[]>(`${API_BASE}/categories`);
    return data ?? [];
  }

  async getCategoryById(id: string): Promise<BusinessCategory | null> {
    return jsonFetch<BusinessCategory>(`${API_BASE}/categories/${id}`);
  }

  async getLocationFilters(): Promise<LocationFiltersData> {
    const data = await jsonFetch<LocationFiltersData>(`${API_BASE}/locations`);
    return data ?? ({ states: [], cities: [] } as unknown as LocationFiltersData);
  }

  async getStates(): Promise<State[]> {
    const data = await jsonFetch<State[]>(`${API_BASE}/locations/states`);
    return data ?? [];
  }

  async getCitiesByState(stateId: string): Promise<City[]> {
    const data = await jsonFetch<City[]>(
      `${API_BASE}/locations/states/${stateId}/cities`,
    );
    return data ?? [];
  }

  async quickSearch(query: string, limit: number = 5): Promise<BusinessBasic[]> {
    if (!query || query.length < 2) return [];
    const params = new URLSearchParams({ search: query, limit: String(limit) });
    const data = await jsonFetch<{ businesses: BusinessBasic[] }>(
      `${API_BASE}/quick-search?${params.toString()}`,
    );
    return data?.businesses ?? [];
  }

  async createReview(
    businessId: string,
    review: { rating: number; title?: string; comment?: string },
  ) {
    return jsonFetch(`${API_BASE}/${businessId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
    });
  }
}

export const businessService = new BusinessService();
