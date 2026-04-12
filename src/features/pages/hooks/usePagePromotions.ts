import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { pagePromotionsService } from '../services/page-promotions.service';
import {
  CreatePromotionInput,
  UpdatePromotionInput,
} from '../interfaces/page-promotion.interface';

// Query keys
export const pagePromotionsKeys = {
  all: ['pagePromotions'] as const,
  lists: () => [...pagePromotionsKeys.all, 'list'] as const,
  list: (pageId: string, includeInactive: boolean) =>
    [...pagePromotionsKeys.lists(), pageId, includeInactive] as const,
  active: (pageId: string) => [...pagePromotionsKeys.all, 'active', pageId] as const,
};

/**
 * Hook to fetch all page promotions
 */
export function usePagePromotions(pageId: string, includeInactive: boolean = false) {
  return useQuery({
    queryKey: pagePromotionsKeys.list(pageId, includeInactive),
    queryFn: () => pagePromotionsService.getPagePromotions(pageId, includeInactive),
    enabled: !!pageId,
  });
}

/**
 * Hook to fetch only active promotions
 */
export function useActivePromotions(pageId: string) {
  return useQuery({
    queryKey: pagePromotionsKeys.active(pageId),
    queryFn: () => pagePromotionsService.getActivePromotions(pageId),
    enabled: !!pageId,
  });
}

/**
 * Hook to create a promotion
 */
export function useCreatePromotion(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePromotionInput) =>
      pagePromotionsService.createPromotion(pageId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagePromotionsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pagePromotionsKeys.active(pageId) });
    },
  });
}

/**
 * Hook to update a promotion
 */
export function useUpdatePromotion(pageId: string, promotionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePromotionInput) =>
      pagePromotionsService.updatePromotion(pageId, promotionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagePromotionsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pagePromotionsKeys.active(pageId) });
    },
  });
}

/**
 * Hook to delete a promotion
 */
export function useDeletePromotion(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (promotionId: string) =>
      pagePromotionsService.deletePromotion(pageId, promotionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagePromotionsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pagePromotionsKeys.active(pageId) });
    },
  });
}

/**
 * Hook to validate a promotion code
 */
export function useValidateCode(pageId: string, code: string) {
  return useQuery({
    queryKey: [...pagePromotionsKeys.all, 'validate', pageId, code],
    queryFn: () => pagePromotionsService.validateCode(pageId, code),
    enabled: !!pageId && !!code && code.length >= 3,
  });
}
