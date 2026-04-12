import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { pageProductsService } from '@/services/page-products.service';
import type {
  PageProduct,
  PaginatedProducts,
  CreateProductDto,
  UpdateProductDto,
  ProductFilters,
  ApplyPromotionDto,
} from '@/interfaces/page-product.interface';

// ============================================================================
// Query Keys
// ============================================================================

export const pageProductsKeys = {
  all: ['pageProducts'] as const,
  lists: () => [...pageProductsKeys.all, 'list'] as const,
  list: (pageId: string, filters?: ProductFilters) =>
    [...pageProductsKeys.lists(), pageId, filters] as const,
  details: () => [...pageProductsKeys.all, 'detail'] as const,
  detail: (pageId: string, productId: string) =>
    [...pageProductsKeys.details(), pageId, productId] as const,
  featured: (pageId: string) => [...pageProductsKeys.all, 'featured', pageId] as const,
};

// ============================================================================
// Queries
// ============================================================================

/**
 * Hook to get paginated products for a page
 */
export function usePageProducts(
  pageId: string,
  filters?: ProductFilters,
  options?: Omit<UseQueryOptions<PaginatedProducts>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: pageProductsKeys.list(pageId, filters),
    queryFn: () => pageProductsService.getProducts(pageId, filters),
    enabled: !!pageId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to get a single product by ID
 */
export function useProduct(
  pageId: string,
  productId: string,
  options?: Omit<UseQueryOptions<PageProduct>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: pageProductsKeys.detail(pageId, productId),
    queryFn: () => pageProductsService.getProductById(pageId, productId),
    enabled: !!pageId && !!productId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}

/**
 * Hook to get featured products for a page
 */
export function useFeaturedProducts(
  pageId: string,
  limit: number = 10,
  options?: Omit<UseQueryOptions<PageProduct[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: pageProductsKeys.featured(pageId),
    queryFn: () => pageProductsService.getFeaturedProducts(pageId, limit),
    enabled: !!pageId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  });
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Hook to create a new product
 */
export function useCreateProduct(
  pageId: string,
  options?: UseMutationOptions<PageProduct, Error, CreateProductDto>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productData: CreateProductDto) =>
      pageProductsService.createProduct(pageId, productData),
    onError: (error) => {
      toast.error('Error al crear el producto', {
        description: error.message || 'Intenta nuevamente',
      });
    },
    onSuccess: (data) => {
      toast.success('Producto creado exitosamente');
      // Invalidate all product lists for this page
      queryClient.invalidateQueries({ 
        queryKey: pageProductsKeys.lists(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({ 
        queryKey: pageProductsKeys.featured(pageId),
        refetchType: 'active',
      });
    },
    ...options,
  });
}

/**
 * Hook to update an existing product
 */
export function useUpdateProduct(
  pageId: string,
  productId: string,
  options?: UseMutationOptions<PageProduct, Error, UpdateProductDto>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productData: UpdateProductDto) =>
      pageProductsService.updateProduct(pageId, productId, productData),
    onError: (error) => {
      toast.error('Error al actualizar el producto', {
        description: error.message || 'Intenta nuevamente',
      });
    },
    onSuccess: (data) => {
      toast.success('Producto actualizado exitosamente');
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: pageProductsKeys.detail(pageId, productId),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({ 
        queryKey: pageProductsKeys.lists(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({ 
        queryKey: pageProductsKeys.featured(pageId),
        refetchType: 'active',
      });
    },
    ...options,
  });
}

/**
 * Hook to delete a product
 */
export function useDeleteProduct(
  pageId: string,
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      pageProductsService.deleteProduct(pageId, productId),
    onError: (error) => {
      toast.error('Error al eliminar el producto', {
        description: error.message || 'Intenta nuevamente',
      });
    },
    onSuccess: () => {
      toast.success('Producto eliminado exitosamente');
      queryClient.invalidateQueries({ 
        queryKey: pageProductsKeys.lists(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({ 
        queryKey: pageProductsKeys.featured(pageId),
        refetchType: 'active',
      });
    },
    ...options,
  });
}

/**
 * Hook to apply a promotion to a product
 */
export function useApplyPromotion(
  pageId: string,
  productId: string,
  options?: UseMutationOptions<PageProduct, Error, ApplyPromotionDto>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (promotionData: ApplyPromotionDto) =>
      pageProductsService.applyPromotion(pageId, productId, promotionData),
    onError: (error) => {
      toast.error('Error al aplicar la promoción', {
        description: error.message || 'Intenta nuevamente',
      });
    },
    onSuccess: () => {
      toast.success('Promoción aplicada exitosamente');
      queryClient.invalidateQueries({
        queryKey: pageProductsKeys.detail(pageId, productId),
      });
      queryClient.invalidateQueries({ queryKey: pageProductsKeys.list(pageId) });
      queryClient.invalidateQueries({ queryKey: pageProductsKeys.featured(pageId) });
    },
    ...options,
  });
}

/**
 * Hook to remove a promotion from a product
 */
export function useRemovePromotion(
  pageId: string,
  productId: string,
  options?: UseMutationOptions<PageProduct, Error, void>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => pageProductsService.removePromotion(pageId, productId),
    onError: (error) => {
      toast.error('Error al remover la promoción', {
        description: error.message || 'Intenta nuevamente',
      });
    },
    onSuccess: () => {
      toast.success('Promoción removida exitosamente');
      queryClient.invalidateQueries({
        queryKey: pageProductsKeys.detail(pageId, productId),
      });
      queryClient.invalidateQueries({ queryKey: pageProductsKeys.list(pageId) });
      queryClient.invalidateQueries({ queryKey: pageProductsKeys.featured(pageId) });
    },
    ...options,
  });
}
