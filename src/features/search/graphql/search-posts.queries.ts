import { gql } from '@apollo/client';

/**
 * ========================================================================
 * BÚSQUEDA DE POSTS - GraphQL Queries
 * ========================================================================
 */

/**
 * Query para buscar posts por contenido
 * 
 * @example
 * query SearchPosts($query: String!, $limit: Int, $offset: Int) {
 *   searchPosts(query: "react tutorial", limit: 20, offset: 0) { ... }
 * }
 */
export const SEARCH_POSTS_QUERY = gql`
  query SearchPosts($query: String!, $limit: Int, $offset: Int) {
    searchPosts(query: $query, limit: $limit, offset: $offset) {
      posts {
        id
        content
        author {
          id
          username
          firstName
          lastName
          avatar
          isVerified
        }
        createdAt
        likesCount
        commentsCount
        sharesCount
        isLiked
        mediaFiles {
          url
          type
        }
        privacy {
          value
        }
      }
      totalCount
      hasMore
    }
  }
`;
