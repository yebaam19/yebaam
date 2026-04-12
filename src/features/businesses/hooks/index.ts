/**
 * Business Hooks - Barrel Export
 */

// Real API hooks with TanStack Query
export {
  useBusinesses,
  useBusinessById,
  useBusinessBySlug,
  useBusinessesByCity,
  useBusinessesByCategory,
  useBusinessCategories,
  useBusinessCategory,
  useLocationFilters,
  useStates,
  useCitiesByState,
  useQuickSearch,
  useCreateReview,
  useBusinessSearch,
  useCreateBusiness,
  useUpdateBusiness,
  businessKeys,
} from './useBusinesses';

// Photo hooks
export {
  useBusinessPhotos,
  useBusinessPhotosCount,
  useUploadBusinessPhoto,
  useUploadMultipleBusinessPhotos,
  useDeleteBusinessPhoto,
  businessPhotosKeys,
} from './useBusinessPhotos';
