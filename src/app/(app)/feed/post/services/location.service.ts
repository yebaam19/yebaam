/**
 * Location Service
 * 
 * Servicio para buscar ubicaciones usando Google Places API
 * (o alternativa similar)
 */

export interface LocationSearchResult {
  placeId: string;
  name: string;
  address: string;
  city?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export class LocationService {
  /**
   * Busca ubicaciones por texto
   * 
   * @param query - Texto de búsqueda
   * @returns Lista de ubicaciones encontradas
   * 
   * TODO: Implementar cuando el backend tenga el endpoint
   * Endpoint esperado: GET /api/locations/search?q={query}
   */
  async searchLocations(query: string): Promise<LocationSearchResult[]> {
    // Simulación temporal - Reemplazar con llamada real
    console.log('[LocationService] Buscando ubicaciones:', query);
    
    // TODO: Implementar llamada al backend
    // const response = await axios.get(`/locations/search`, {
    //   params: { q: query }
    // });
    // return response.data;
    
    // Mock data para desarrollo
    return [
      {
        placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        name: query,
        address: `Dirección de ${query}`,
        city: 'Ciudad',
        country: 'País',
        coordinates: { lat: 0, lng: 0 },
      },
    ];
  }

  /**
   * Obtiene la ubicación actual del usuario
   * 
   * @returns Ubicación actual
   */
  async getCurrentLocation(): Promise<LocationSearchResult | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // TODO: Hacer reverse geocoding en el backend
          // const response = await axios.get('/locations/reverse', {
          //   params: { lat: latitude, lng: longitude }
          // });
          
          resolve({
            placeId: `current_${latitude}_${longitude}`,
            name: 'Tu ubicación actual',
            address: `${latitude}, ${longitude}`,
            coordinates: { lat: latitude, lng: longitude },
          });
        },
        () => resolve(null)
      );
    });
  }
}

export const locationService = new LocationService();
