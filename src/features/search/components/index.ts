/**
 * Barrel export para componentes de búsqueda
 */

// Input y filtros
export { SearchInput } from './SearchInput';
export { SearchFilters } from './SearchFilters';

// Result cards
export { UserResultCard } from './UserResultCard';
export { PostResultCard } from './PostResultCard';
export { HashtagResultCard } from './HashtagResultCard';
export { PageResultCard } from './PageResultCard';
export { PageContentResultCard } from './PageContentResultCard';

// Results list (facets agregados de /api/search)
export { SearchResultsList } from './SearchResultsList';

// Skeleton loaders
export {
  UserResultSkeleton,
  PostResultSkeleton,
  HashtagResultSkeleton,
  SearchResultsSkeleton,
} from './SearchResultsSkeleton';

// History & Suggestions
export { SearchHistory } from './SearchHistory';
export { SearchSuggestions } from './SearchSuggestions';

// Empty states
export { SearchEmptyState } from './SearchEmptyState';
