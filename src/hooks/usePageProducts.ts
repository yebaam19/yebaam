'use client';

import { toast } from 'sonner';
import { useFetch } from '@/lib/hooks/useFetch';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { invalidate } from '@/lib/hooks/cacheStore';
import { pageProductsService } from '@/services/page-products.service';
import type {
  CreateProductDto,
  UpdateProductDto,
  ProductFilters,
  ApplyPromotionDto,
} from '@/interfaces/page-product.interface';

// Query Keys
export const pageProductsKeys = {
  all: ['pageProducts'] as const,
  lists: () => [...pageProductsKeys.all, 'list'] as const,
  list: (pageId: string, filters?: ProductFilters) =>
    [...pageProductsKeys.lists(), pageId, JSON.stringify(filters ?? {})] as const,
  details: () => [...pageProductsKeys.all, 'detail'] as const,
  detail: (pageId: string, productId: string) =>
    [...pageProductsKeys.details(), pageId, productId] as const,
  featured: (pageId: string) => [...pageProductsKeys.all, 'featured', pageId] as const,
};

export function usePageProducts(pageId: string, filters?: ProductFilters) {
  return useFetch(
    pageProductsKeys.list(pageId, filters),
    () => pageProductsService.getProducts(pageId, filters),
    { enabled: !!pageId, staleTime: 1000 * 60 * 5 }
  );
}

export function useProduct(pageId: string, productId: string) {
  return useFetch(
    pageProductsKeys.detail(pageId, productId),
    () => pageProductsService.getProductById(pageId, productId),
    { enabled: !!pageId && !!productId, staleTime: 1000 * 60 * 5 }
  );
}

export function useFeaturedProducts(pageId: string, limit: number = 10) {
  return useFetch(
    pageProductsKeys.featured(pageId),
    () => pageProductsService.getFeaturedProducts(pageId, limit),
    { enabled: !!pageId, staleTime: 1000 * 60 * 10 }
  );
}

export function useCreateProduct(pageId: string) {
  return useAsyncAction(
    (productData: CreateProductDto) => pageProductsService.createProduct(pageId, productData),
    {
      onError: (error) => {
        toast.error('Error al crear el producto', {
          description: error.message || 'Intenta nuevamente',
        });
      },
      onSuccess: () => {
        toast.success('Producto creado exitosamente');
        invalidate('pageProducts::list');
        invalidate(`pageProducts::featured::${pageId}`);
      },
    }
  );
}

export function useUpdateProduct(pageId: string, productId: string) {
  return useAsyncAction(
    (productData: UpdateProductDto) =>
      pageProductsService.updateProduct(pageId, productId, productData),
    {
      onError: (error) => {
        toast.error('Error al actualizar el producto', {
          description: error.message || 'Intenta nuevamente',
        });
      },
      onSuccess: () => {
        toast.success('Producto actualizado exitosamente');
        invalidate(`pageProducts::detail::${pageId}::${productId}`);
        invalidate('pageProducts::list');
        invalidate(`pageProducts::featured::${pageId}`);
      },
    }
  );
}

export function useDeleteProduct(pageId: string) {
  return useAsyncAction(
    (productId: string) => pageProductsService.deleteProduct(pageId, productId),
    {
      onError: (error) => {
        toast.error('Error al eliminar el producto', {
          description: error.message || 'Intenta nuevamente',
        });
      },
      onSuccess: () => {
        toast.success('Producto eliminado exitosamente');
        invalidate('pageProducts::list');
        invalidate(`pageProducts::featured::${pageId}`);
      },
    }
  );
}

export function useApplyPromotion(pageId: string, productId: string) {
  return useAsyncAction(
    (promotionData: ApplyPromotionDto) =>
      pageProductsService.applyPromotion(pageId, productId, promotionData),
    {
      onError: (error) => {
        toast.error('Error al aplicar la promoción', {
          description: error.message || 'Intenta nuevamente',
        });
      },
      onSuccess: () => {
        toast.success('Promoción aplicada exitosamente');
        invalidate(`pageProducts::detail::${pageId}::${productId}`);
        invalidate(`pageProducts::list::${pageId}`);
        invalidate(`pageProducts::featured::${pageId}`);
      },
    }
  );
}

export function useRemovePromotion(pageId: string, productId: string) {
  return useAsyncAction(
    () => pageProductsService.removePromotion(pageId, productId),
    {
      onError: (error) => {
        toast.error('Error al remover la promoción', {
          description: error.message || 'Intenta nuevamente',
        });
      },
      onSuccess: () => {
        toast.success('Promoción removida exitosamente');
        invalidate(`pageProducts::detail::${pageId}::${productId}`);
        invalidate(`pageProducts::list::${pageId}`);
        invalidate(`pageProducts::featured::${pageId}`);
      },
    }
  );
}
