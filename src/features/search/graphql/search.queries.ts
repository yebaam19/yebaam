import { gql } from '@apollo/client';

/**
 * Query para buscar usuarios (compatible con backend NestJS + Redis)
 * Usa el nuevo sistema de búsqueda con scoring y paginación
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
 * Query principal de búsqueda (LEGACY - mantener para compatibilidad)
 * TODO: Migrar a nuevo sistema cuando posts/hashtags/grupos estén listos
 */
export const SEARCH_QUERY = gql`
  query Search($query: String!, $filters: SearchFilters) {
    search(query: $query, filters: $filters) {
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
        mediaFiles {
          url
          type
        }
        privacy {
          value
        }
      }
      hashtags {
        name
        postsCount
        trendingScore
      }
      groups {
        id
        name
        description
        coverImage
        membersCount
        privacy
        isMember
      }
      totalCount
      hasMore
    }
  }
`;

/**
 * Query para búsqueda global inteligente (NUEVO)
 * Busca en usuarios, posts, hashtags y comentarios
 * Soporta auto-detección de tipo: @usuario, #hashtag, texto
 */
export const SEARCH_GLOBAL_QUERY = gql`
  query SearchGlobal($input: GlobalSearchInput!) {
    searchGlobal(input: $input) {
      users {
        results {
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
        total
        hasMore
      }
      posts {
        results {
          id
          content
          score
        }
        total
        hasMore
      }
      hashtags {
        results {
          tag
          postsCount
          score
        }
        total
        hasMore
      }
      comments {
        results
        total
        hasMore
      }
      metadata {
        query
        searchType
        totalResults
        searchTime
        fromCache
      }
    }
  }
`;

/**
 * Query para búsqueda rápida (autocomplete)
 * Límite de 5 resultados por tipo
 */
export const QUICK_SEARCH_QUERY = gql`
  query QuickSearch($query: String!) {
    quickSearch(query: $query) {
      users {
        results {
          id
          username
          displayName
          avatar
          isVerified
        }
        total
      }
      metadata {
        query
        searchType
        totalResults
      }
    }
  }
`;

/**
 * Query para buscar solo posts
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

/**
 * Query para buscar hashtags
 */
export const SEARCH_HASHTAGS_QUERY = gql`
  query SearchHashtags($query: String!, $limit: Int) {
    searchHashtags(query: $query, limit: $limit) {
      hashtags {
        name
        postsCount
        trendingScore
      }
    }
  }
`;

/**
 * Query para obtener sugerencias populares
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

/**
 * ========================================================================
 * HISTORIAL DE BÚSQUEDA - Backend GraphQL
 * ========================================================================
 */


/**
 * Mutation para guardar una búsqueda en el historial (backend)
 * Se llama cada vez que el usuario hace una búsqueda
 * El backend debe:
 * 1. Crear registro en DB con userId, query, type, timestamp
 * 2. Limitar a últimas 50-100 búsquedas por usuario
 * 3. Eliminar duplicados (misma query en corto período)
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
 */
export const CLEAR_SEARCH_HISTORY_MUTATION = gql`
  mutation ClearSearchHistory {
    clearSearchHistory {
      success
    }
  }
`;
