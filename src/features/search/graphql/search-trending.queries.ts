import { gql } from '@apollo/client';

/**
 * ========================================================================
 * TRENDING & SUGERENCIAS - GraphQL Queries
 * ========================================================================
 */

/**
 * Query para obtener sugerencias populares (trending searches)
 * El backend puede usar Redis para cachear estas sugerencias
 * 
 * @example
 * query GetTrendingSearches($limit: Int) {
 *   trendingSearches(limit: 10) { ... }
 * }
 */
export const GET_TRENDING_SEARCHES_QUERY = gql`
  query GetTrendingSearches($limit: Int) {
    trendingSearches(limit: $limit) {
      id
      query
      type
      count
      score
    }
  }
`;
