/**
 * Interfaces para el módulo de búsqueda con GraphQL
 */

/**
 * Tipos de resultados de búsqueda.
 * `hashtags` / `groups` quedan sólo por compatibilidad con entradas viejas del
 * historial (localStorage) — no tienen backend y ya no se ofrecen como filtro.
 */
export type SearchResultType =
  | 'all'
  | 'users'
  | 'pages'
  | 'posts'
  | 'articles'
  | 'events'
  | 'auditions'
  | 'hashtags'
  | 'groups';

export const SEARCH_RESULT_TYPES: readonly SearchResultType[] = [
  'all',
  'users',
  'pages',
  'posts',
  'articles',
  'events',
  'auditions',
  'hashtags',
  'groups',
];

export function isSearchResultType(value: string): value is SearchResultType {
  return (SEARCH_RESULT_TYPES as readonly string[]).includes(value);
}

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
// BÚSQUEDA AGREGADA (/api/search + /api/search/users)
// ==========================================

/**
 * Página propietaria de un resultado hijo (post/artículo/evento/audición).
 * `null` cuando la página no es visible para el viewer.
 */
export interface SearchPageRef {
  id: string;
  slug: string;
  name: string;
  profileImageUrl: string | null;
}

/** Página en resultados de búsqueda (facet `pages` de /api/search). */
export interface PageSearchResult {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  profileImageUrl?: string;
  isVerified: boolean;
  followerCount: number;
}

/** Publicación de página (facet `posts` de /api/search). */
export interface PagePostSearchResult {
  id: string;
  content: string;
  createdAt: string;
  page: SearchPageRef | null;
}

/** Artículo de página (facet `articles`). */
export interface PageArticleSearchResult {
  id: string;
  title: string;
  description: string | null;
  publishedAt: string | null;
  page: SearchPageRef | null;
}

/** Evento de página (facet `events`). */
export interface PageEventSearchResult {
  id: string;
  title: string;
  place: string | null;
  startsAt: string;
  page: SearchPageRef | null;
}

/** Audición de página (facet `auditions`). */
export interface PageAuditionSearchResult {
  id: string;
  title: string;
  city: string | null;
  startsAt: string | null;
  page: SearchPageRef | null;
}

/** Resultado combinado que consume la página /search. */
export interface AggregatedSearchResults {
  users: UserSearchResult[];
  pages: PageSearchResult[];
  posts: PagePostSearchResult[];
  articles: PageArticleSearchResult[];
  events: PageEventSearchResult[];
  auditions: PageAuditionSearchResult[];
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
