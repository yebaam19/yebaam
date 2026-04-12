import { gql } from '@apollo/client';

/**
 * ========================================================================
 * BÚSQUEDA DE HASHTAGS - GraphQL Queries
 * ========================================================================
 */

/**
 * Query para buscar hashtags
 * 
 * @example
 * query SearchHashtags($query: String!, $limit: Int) {
 *   searchHashtags(query: "javascript", limit: 20) { ... }
 * }
 */
export const SEARCH_HASHTAGS_QUERY = gql`
  query SearchHashtags($query: String!, $limit: Int) {
    searchHashtags(query: $query, limit: $limit) {
      hashtags {
        name
        postsCount
        trendingScore
        isTrending
        growthRate
      }
    }
  }
`;
