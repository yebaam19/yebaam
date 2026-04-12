import { gql } from '@apollo/client';

/**
 * ========================================================================
 * BÚSQUEDA DE USUARIOS - GraphQL Queries
 * ========================================================================
 */

/**
 * Query para buscar usuarios (compatible con backend NestJS + Redis)
 * Usa el nuevo sistema de búsqueda con scoring y paginación
 * 
 * @example
 * query SearchUsers($input: SearchUsersInput!) {
 *   searchUsers(input: { query: "john", limit: 20 }) { ... }
 * }
 */
export const SEARCH_USERS_QUERY = gql`
  query SearchUsers($input: SearchUsersInput!) {
    searchUsers(input: $input) {
      items {
        id
        username
        firstName
        middleName
        lastName
        secondLastName
        displayName
        bio
        avatar
        coverPhoto
        isVerified
        isFriend
        followersCount
        followingCount
        friendsCount
        mutualFriendsCount
        score
      }
      pageInfo {
        hasNextPage
        endCursor
        total
      }
      query
      took
    }
  }
`;

/**
 * Query LEGACY para buscar solo usuarios
 * @deprecated Use SEARCH_USERS_QUERY instead
 * 
 * @example
 * query SearchUsers($query: String!, $limit: Int, $offset: Int) {
 *   searchUsers(query: "john", limit: 20, offset: 0) { ... }
 * }
 */
export const SEARCH_USERS_QUERY_LEGACY = gql`
  query SearchUsers($query: String!, $limit: Int, $offset: Int) {
    searchUsers(query: $query, limit: $limit, offset: $offset) {
      users {
        id
        username
        firstName
        lastName
        avatar
        bio
        isVerified
        followersCount
        mutualFriendsCount
        isFollowing
      }
      totalCount
      hasMore
    }
  }
`;
