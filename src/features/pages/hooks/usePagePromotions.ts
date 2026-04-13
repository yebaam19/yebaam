'use client';

import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { invalidate } from '@/lib/hooks/cacheStore';
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

export function usePagePromotions(pageId: string, includeInactive: boolean = false) {
  return useFetch(
    pagePromotionsKeys.list(pageId, includeInactive),
    () => pagePromotionsService.getPagePromotions(pageId, includeInactive),
    { enabled: !!pageId }
  );
}

export function useActivePromotions(pageId: string) {
  return useFetch(
    pagePromotionsKeys.active(pageId),
    () => pagePromotionsService.getActivePromotions(pageId),
    { enabled: !!pageId }
  );
}

export function useCreatePromotion(pageId: string) {
  return useAsyncAction(
    (input: CreatePromotionInput) => pagePromotionsService.createPromotion(pageId, input),
    {
      onSuccess: () => {
        invalidate('pagePromotions::list');
        invalidate(`pagePromotions::active::${pageId}`);
      },
    }
  );
}

export function useUpdatePromotion(pageId: string, promotionId: string) {
  return useAsyncAction(
    (input: UpdatePromotionInput) =>
      pagePromotionsService.updatePromotion(pageId, promotionId, input),
    {
      onSuccess: () => {
        invalidate('pagePromotions::list');
        invalidate(`pagePromotions::active::${pageId}`);
      },
    }
  );
}

export function useDeletePromotion(pageId: string) {
  return useAsyncAction(
    (promotionId: string) => pagePromotionsService.deletePromotion(pageId, promotionId),
    {
      onSuccess: () => {
        invalidate('pagePromotions::list');
        invalidate(`pagePromotions::active::${pageId}`);
      },
    }
  );
}

export function useValidateCode(pageId: string, code: string) {
  return useFetch(
    [...pagePromotionsKeys.all, 'validate', pageId, code],
    () => pagePromotionsService.validateCode(pageId, code),
    { enabled: !!pageId && !!code && code.length >= 3 }
  );
}
