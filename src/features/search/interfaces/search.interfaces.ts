/**
 * Interfaces para el módulo de búsqueda con GraphQL
 */

/**
 * Tipos de resultados de búsqueda
 */
export type SearchResultType = 'all' | 'users' | 'posts' | 'hashtags' | 'groups';

/**
 * Sort options para búsqueda (compatible con backend)
 */
export type SearchSortBy = 'RELEVANCE' | 'RECENT' | 'POPULAR';

/**
 * Filtros de búsqueda
 */
export interface SearchFilters {
  type?: SearchResultType;
  dateRange?: {
    from?: string;
    to?: string;
  };
  sortBy?: 'relevance' | 'recent' | 'popular';
  limit?: number;
  offset?: number;
}

// ==========================================
// NUEVAS INTERFACES (Backend GraphQL + Redis)
// ==========================================

/**
 * Input para búsqueda de usuarios (compatible con backend)
 */
export interface SearchUsersInput {
  query: string;
  limit?: number;
  cursor?: string;
  friendsOnly?: boolean;
  verifiedOnly?: boolean;
  sortBy?: SearchSortBy;
}

/**
 * Usuario en resultados de búsqueda (Nueva versión con scoring)
 */
export interface SearchUserResult {
  id: string;
  username: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  displayName?: string | null;
  bio?: string | null;
  avatar?: string | null;
  coverPhoto?: string | null;
  isVerified: boolean;
  isFriend?: boolean;
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  mutualFriendsCount: number;
  score: number; // Score de relevancia
}

/**
 * PageInfo para paginación cursor-based
 */
export interface PageInfo {
  hasNextPage: boolean;
  endCursor?: string | null;
  total: number;
}

/**
 * Respuesta de búsqueda de usuarios
 */
export interface SearchUsersResponse {
  items: SearchUserResult[];
  pageInfo: PageInfo;
  query: string;
  took: number; // Tiempo en ms
}

// ==========================================
// GLOBAL SEARCH (Nuevo sistema multi-entidad)
// ==========================================

/**
 * Tipos de entidad para búsqueda global
 */
export type SearchEntityType = 'ALL' | 'USERS' | 'POSTS' | 'HASHTAGS' | 'COMMENTS';

/**
 * Input para búsqueda global
 */
export interface GlobalSearchInput {
  query: string;
  type?: SearchEntityType;
  limit?: number;
  cursor?: string;
  filters?: {
    isVerified?: boolean;
    hasMedia?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
  };
}

/**
 * Resultado de post en búsqueda global
 */
export interface GlobalSearchPostResult {
  id: string;
  content: string;
  score: number;
}

/**
 * Resultado de hashtag en búsqueda global
 */
export interface GlobalSearchHashtagResult {
  tag: string;
  postsCount: number;
  score: number;
}

/**
 * Sección de resultados por tipo
 */
export interface GlobalSearchSection<T> {
  results: T[];
  total: number;
  hasMore: boolean;
}

/**
 * Metadata de la búsqueda global
 */
export interface GlobalSearchMetadata {
  query: string;
  searchType: SearchEntityType;
  totalResults: number;
  searchTime: number;
  fromCache: boolean;
}

/**
 * Respuesta completa de búsqueda global
 */
export interface GlobalSearchResponse {
  users?: GlobalSearchSection<SearchUserResult>;
  posts?: GlobalSearchSection<GlobalSearchPostResult>;
  hashtags?: GlobalSearchSection<GlobalSearchHashtagResult>;
  comments?: GlobalSearchSection<string>;
  metadata: GlobalSearchMetadata;
}

// ==========================================
// INTERFACES LEGACY (Mantener compatibilidad)
// ==========================================

/**
 * Usuario en resultados de búsqueda (LEGACY)
 * @deprecated Use SearchUserResult instead
 */
export interface UserSearchResult {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  bio?: string | null;
  isVerified?: boolean;
  followersCount?: number;
  mutualFriendsCount?: number;
  isFollowing?: boolean;
}

/**
 * Post en resultados de búsqueda
 */
export interface PostSearchResult {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    isVerified?: boolean;
  };
  createdAt: string;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  isLiked?: boolean;
  mediaFiles?: Array<{
    url: string;
    type: 'image' | 'video';
  }>;
  privacy?: {
    value: 'public' | 'friends' | 'private';
  };
}

/**
 * Hashtag en resultados de búsqueda
 */
export interface HashtagSearchResult {
  name: string;
  postsCount: number;
  trendingScore?: number;
  isTrending?: boolean;
  growthRate?: number;
}

/**
 * Grupo en resultados de búsqueda
 */
export interface GroupSearchResult {
  id: string;
  name: string;
  description?: string;
  coverImage?: string | null;
  membersCount: number;
  privacy: 'public' | 'private';
  isMember?: boolean;
}

/**
 * Resultado general de búsqueda
 */
export interface SearchResults {
  users: UserSearchResult[];
  posts: PostSearchResult[];
  hashtags: HashtagSearchResult[];
  groups: GroupSearchResult[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Historial de búsqueda (local)
 */
export interface SearchHistoryItem {
  id: string;
  query: string;
  type: SearchResultType;
  timestamp: string;
}

/**
 * Sugerencia de búsqueda
 */
export interface SearchSuggestion {
  id: string;
  query: string;
  type: SearchResultType;
  count?: number;
  score?: number;
}

/**
 * Variables para la query de búsqueda
 */
export interface SearchQueryVariables {
  query: string;
  filters?: SearchFilters;
}

/**
 * Respuesta de la query de búsqueda
 */
export interface SearchQueryResponse {
  search: SearchResults;
}
