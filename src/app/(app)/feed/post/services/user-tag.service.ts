/**
 * User Tag Service
 * 
 * Servicio para buscar y etiquetar usuarios en posts
 */

export interface TaggableUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isFriend?: boolean;
}

export class UserTagService {
  /**
   * Busca usuarios para etiquetar
   * 
   * @param query - Texto de búsqueda
   * @param limit - Número máximo de resultados
   * @returns Lista de usuarios encontrados
   * 
   * TODO: Implementar cuando el backend tenga el endpoint
   * Endpoint esperado: GET /api/users/search?q={query}&limit={limit}&friendsOnly=true
   */
  async searchUsers(query: string, limit: number = 10): Promise<TaggableUser[]> {
    console.log('[UserTagService] Buscando usuarios:', query);
    
    // TODO: Implementar llamada al backend
    // const response = await axios.get('/users/search', {
    //   params: { q: query, limit, friendsOnly: true }
    // });
    // return response.data;
    
    // Mock data para desarrollo
    return [];
  }

  /**
   * Obtiene lista de amigos del usuario para etiquetar
   * 
   * @param limit - Número máximo de resultados
   * @returns Lista de amigos
   * 
   * TODO: Implementar cuando el backend tenga el endpoint
   * Endpoint esperado: GET /api/users/friends?limit={limit}
   */
  async getFriends(limit: number = 20): Promise<TaggableUser[]> {
    console.log('[UserTagService] Obteniendo amigos');
    
    // TODO: Implementar llamada al backend
    // const response = await axios.get('/users/friends', {
    //   params: { limit }
    // });
    // return response.data;
    
    // Mock data para desarrollo
    return [];
  }

  /**
   * Obtiene amigos sugeridos para etiquetar basándose en contexto
   * 
   * @param location - Ubicación del post (opcional)
   * @returns Lista de usuarios sugeridos
   */
  async getSuggestedTags(location?: string): Promise<TaggableUser[]> {
    console.log('[UserTagService] Obteniendo sugerencias de tags');
    
    // TODO: Implementar lógica de sugerencias inteligentes
    return this.getFriends(5);
  }
}

export const userTagService = new UserTagService();
