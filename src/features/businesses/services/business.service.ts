import {
  BusinessBasic,
  BusinessCategory,
  BusinessDetailResponse,
  BusinessesListResponse,
  BusinessFilters,
  City,
  LocationFiltersData,
  State,
} from '../interfaces/business.interfaces'

import { getAxiosInstance } from '@/lib/legacy-api/client';

const API_BASE = '/api/businesses';

/**
 * Business Service
 * 
 * Servicio para manejar todas las operaciones relacionadas con negocios.
 * Usa axios con TanStack Query para caché y gestión de estado.
 */
class BusinessService {
  private getAxios() {
    return getAxiosInstance();
  }

  /**
   * Obtener negocio por ID
   */
  async getBusinessById(id: string): Promise<BusinessDetailResponse | null> {
    try {
      const axios = this.getAxios();
      const { data } = await axios.get(`${API_BASE}/${id}`);
      return data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Obtener negocio por slug (URL-friendly)
   */
  async getBusinessBySlug(slug: string): Promise<BusinessDetailResponse | null> {
    try {
      const axios = this.getAxios();
      const { data } = await axios.get(`${API_BASE}/${slug}`);
      return data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Buscar y filtrar negocios con paginación
   */
  async getBusinesses(filters: BusinessFilters = {}): Promise<BusinessesListResponse> {
    const axios = this.getAxios();
    
    // Construir query params
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.cityId) params.append('cityId', filters.cityId);
    if (filters.stateId) params.append('stateId', filters.stateId);
    if (filters.minRating !== undefined) params.append('minRating', filters.minRating.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const { data } = await axios.get(`${API_BASE}?${params.toString()}`);
    return data;
  }

  /**
   * Obtener negocios por ciudad
   */
  async getBusinessesByCity(
    cityId: string,
    filters: Omit<BusinessFilters, 'cityId'> = {}
  ): Promise<BusinessesListResponse> {
    return this.getBusinesses({ ...filters, cityId });
  }

  /**
   * Obtener negocios por categoría
   */
  async getBusinessesByCategory(
    categoryId: string,
    filters: Omit<BusinessFilters, 'categoryId'> = {}
  ): Promise<BusinessesListResponse> {
    return this.getBusinesses({ ...filters, categoryId });
  }

  /**
   * Obtener todas las categorías de negocios
   */
  async getCategories(): Promise<BusinessCategory[]> {
    const axios = this.getAxios();
    const { data } = await axios.get(`${API_BASE}/categories`);
    return data;
  }

  /**
   * Obtener categoría por ID
   */
  async getCategoryById(id: string): Promise<BusinessCategory | null> {
    try {
      const axios = this.getAxios();
      const { data } = await axios.get(`${API_BASE}/categories/${id}`);
      return data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Obtener datos de ubicación (estados y ciudades)
   */
  async getLocationFilters(): Promise<LocationFiltersData> {
    const axios = this.getAxios();
    const { data } = await axios.get(`${API_BASE}/locations`);
    return data;
  }

  /**
   * Obtener todos los estados/departamentos
   */
  async getStates(): Promise<State[]> {
    const axios = this.getAxios();
    const { data } = await axios.get(`${API_BASE}/locations/states`);
    return data;
  }

  /**
   * Obtener ciudades por estado
   */
  async getCitiesByState(stateId: string): Promise<City[]> {
    const axios = this.getAxios();
    const { data } = await axios.get(`${API_BASE}/locations/states/${stateId}/cities`);
    return data;
  }

  /**
   * Búsqueda rápida (autocompletado)
   * Para usar en search bars con debounce
   */
  async quickSearch(query: string, limit: number = 5): Promise<BusinessBasic[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const axios = this.getAxios();
    const params = new URLSearchParams({
      search: query,
      limit: limit.toString(),
    });

    const { data } = await axios.get(`${API_BASE}/quick-search?${params.toString()}`);
    return data.businesses || [];
  }

  /**
   * Crear reseña para un negocio (requiere autenticación)
   */
  async createReview(businessId: string, review: {
    rating: number;
    title?: string;
    comment?: string;
  }) {
    const axios = this.getAxios();
    const { data } = await axios.post(`${API_BASE}/${businessId}/reviews`, review);
    return data;
  }
}

export const businessService = new BusinessService();
