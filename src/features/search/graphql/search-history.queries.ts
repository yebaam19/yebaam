import { gql } from '@apollo/client';

/**
 * ========================================================================
 * HISTORIAL DE BÚSQUEDA - Backend GraphQL
 * ========================================================================
 */

/**
 * Query para obtener el historial de búsquedas del usuario autenticado
 * El backend debe retornar las últimas N búsquedas del usuario
 * Ordenadas por fecha (más reciente primero)
 * 
 * @example
 * query GetSearchHistory($limit: Int) {
 *   searchHistory(limit: 10) { ... }
 * }
 */
export const GET_SEARCH_HISTORY_QUERY = gql`
  query GetSearchHistory($limit: Int) {
    searchHistory(limit: $limit) {
      id
      query
      type
      timestamp
      resultType
      resultId
      resultPreview {
        ... on UserPreview {
          id
          username
          firstName
          lastName
          avatar
        }
        ... on PostPreview {
          id
          content
          author {
            username
            avatar
          }
        }
        ... on HashtagPreview {
          name
          postsCount
        }
      }
    }
  }
`;

/**
 * Mutation para guardar una búsqueda en el historial (backend)
 * Se llama cada vez que el usuario hace una búsqueda
 * 
 * El backend debe:
 * 1. Crear registro en DB con userId, query, type, timestamp
 * 2. Limitar a últimas 50-100 búsquedas por usuario
 * 3. Eliminar duplicados (misma query en corto período)
 * 
 * @example
 * mutation SaveSearch($input: SaveSearchInput!) {
 *   saveSearch(input: { query: "react", type: "all" }) { ... }
 * }
 */
export const SAVE_SEARCH_MUTATION = gql`
  mutation SaveSearch($input: SaveSearchInput!) {
    saveSearch(input: $input) {
      id
      query
      type
      timestamp
    }
  }
`;

/**
 * Mutation para eliminar una búsqueda específica del historial
 * 
 * @example
 * mutation DeleteSearchHistoryItem($id: ID!) {
 *   deleteSearchHistoryItem(id: "abc123") { success }
 * }
 */
export const DELETE_SEARCH_HISTORY_ITEM_MUTATION = gql`
  mutation DeleteSearchHistoryItem($id: ID!) {
    deleteSearchHistoryItem(id: $id) {
      success
    }
  }
`;

/**
 * Mutation para limpiar TODO el historial de búsqueda del usuario
 * 
 * @example
 * mutation ClearSearchHistory {
 *   clearSearchHistory { success }
 * }
 */
export const CLEAR_SEARCH_HISTORY_MUTATION = gql`
  mutation ClearSearchHistory {
    clearSearchHistory {
      success
    }
  }
`;
