/**
 * GIF Service
 * 
 * Servicio para buscar GIFs usando Giphy/Tenor API
 */

export interface GifSearchResult {
  id: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
  source: 'GIPHY' | 'TENOR';
  title?: string;
}

export class GifService {
  /**
   * Busca GIFs por texto
   * 
   * @param query - Texto de búsqueda
   * @param limit - Número máximo de resultados
   * @returns Lista de GIFs encontrados
   * 
   * TODO: Implementar cuando el backend tenga el endpoint
   * Endpoint esperado: GET /api/gifs/search?q={query}&limit={limit}
   */
  async searchGifs(query: string, limit: number = 20): Promise<GifSearchResult[]> {
    console.log('[GifService] Buscando GIFs:', query);
    
    // TODO: Implementar llamada al backend que se conecte con Giphy/Tenor
    // const response = await axios.get('/gifs/search', {
    //   params: { q: query, limit }
    // });
    // return response.data;
    
    // Mock data para desarrollo
    return [];
  }

  /**
   * Obtiene GIFs trending
   * 
   * @param limit - Número máximo de resultados
   * @returns Lista de GIFs trending
   * 
   * TODO: Implementar cuando el backend tenga el endpoint
   * Endpoint esperado: GET /api/gifs/trending?limit={limit}
   */
  async getTrendingGifs(limit: number = 20): Promise<GifSearchResult[]> {
    console.log('[GifService] Obteniendo GIFs trending');
    
    // TODO: Implementar llamada al backend
    // const response = await axios.get('/gifs/trending', {
    //   params: { limit }
    // });
    // return response.data;
    
    // Mock data para desarrollo
    return [];
  }

  /**
   * Obtiene categorías de GIFs
   * 
   * @returns Lista de categorías
   */
  async getCategories(): Promise<string[]> {
    return [
      'Feliz',
      'Triste',
      'Amor',
      'Risa',
      'Fiesta',
      'Baile',
      'Gato',
      'Perro',
      'Celebración',
      'Gracias',
    ];
  }
}

export const gifService = new GifService();
