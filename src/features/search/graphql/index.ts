/**
 * Barrel export para GraphQL queries de búsqueda
 * Centraliza todas las queries organizadas por módulos
 */

// Query principal (búsqueda unificada)
export { SEARCH_QUERY } from './search.queries';

// Búsqueda de usuarios
export { 
  SEARCH_USERS_QUERY,
  SEARCH_USERS_QUERY_LEGACY 
} from './search-users.queries';

// Búsqueda de posts
export { SEARCH_POSTS_QUERY } from './search-posts.queries';

// Búsqueda de hashtags
export { SEARCH_HASHTAGS_QUERY } from './search-hashtags.queries';

// Trending y sugerencias
export { GET_TRENDING_SEARCHES_QUERY } from './search-trending.queries';

// Historial de búsqueda
export {
  GET_SEARCH_HISTORY_QUERY,
  SAVE_SEARCH_MUTATION,
  DELETE_SEARCH_HISTORY_ITEM_MUTATION,
  CLEAR_SEARCH_HISTORY_MUTATION,
} from './search-history.queries';
