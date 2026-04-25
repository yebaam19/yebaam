import { getAxiosInstance } from '@/lib/http/legacy-client';
import type {
  PageProduct,
  PaginatedProducts,
  CreateProductDto,
  UpdateProductDto,
  ProductFilters,
  ApplyPromotionDto,
} from '@/interfaces/page-product.interface';

const API_BASE = '/api/pages';

/**
 * Service for managing page products
 */
export const pageProductsService = {
  /**
   * Create a new product for a page
   */
  async createProduct(
    pageId: string,
    productData: CreateProductDto
  ): Promise<PageProduct> {
    const axios = await getAxiosInstance();
    const response = await axios.post<PageProduct>(
      `${API_BASE}/${pageId}/products`,
      productData
    );
    return response.data;
  },

  /**
   * Get products for a page with filters and pagination
   */
  async getProducts(
    pageId: string,
    filters?: ProductFilters
  ): Promise<PaginatedProducts> {
    const axios = await getAxiosInstance();
    const response = await axios.get<PaginatedProducts>(
      `${API_BASE}/${pageId}/products`,
      { params: filters }
    );
    return response.data;
  },

  /**
   * Get a single product by ID
   */
  async getProductById(pageId: string, productId: string): Promise<PageProduct> {
    const axios = await getAxiosInstance();
    const response = await axios.get<PageProduct>(
      `${API_BASE}/${pageId}/products/${productId}`
    );
    return response.data;
  },

  /**
   * Update a product
   */
  async updateProduct(
    pageId: string,
    productId: string,
    productData: UpdateProductDto
  ): Promise<PageProduct> {
    const axios = await getAxiosInstance();
    const response = await axios.put<PageProduct>(
      `${API_BASE}/${pageId}/products/${productId}`,
      productData
    );
    return response.data;
  },

  /**
   * Delete a product
   */
  async deleteProduct(pageId: string, productId: string): Promise<void> {
    const axios = await getAxiosInstance();
    await axios.delete(`${API_BASE}/${pageId}/products/${productId}`);
  },

  /**
   * Apply a promotion to a product
   */
  async applyPromotion(
    pageId: string,
    productId: string,
    promotionData: ApplyPromotionDto
  ): Promise<PageProduct> {
    const axios = await getAxiosInstance();
    const response = await axios.patch<PageProduct>(
      `${API_BASE}/${pageId}/products/${productId}/promotion`,
      promotionData
    );
    return response.data;
  },

  /**
   * Remove promotion from a product
   */
  async removePromotion(pageId: string, productId: string): Promise<PageProduct> {
    const axios = await getAxiosInstance();
    const response = await axios.delete<PageProduct>(
      `${API_BASE}/${pageId}/products/${productId}/promotion`
    );
    return response.data;
  },

  /**
   * Get featured products for a page
   */
  async getFeaturedProducts(pageId: string, limit: number = 10): Promise<PageProduct[]> {
    const axios = await getAxiosInstance();
    const response = await axios.get<PaginatedProducts>(
      `${API_BASE}/${pageId}/products`,
      {
        params: {
          hasPromotion: true,
          isActive: true,
          limit,
        },
      }
    );
    return response.data.products;
  },

  /**
   * Search products
   */
  async searchProducts(
    pageId: string,
    searchQuery: string,
    filters?: Omit<ProductFilters, 'searchQuery'>
  ): Promise<PaginatedProducts> {
    const axios = await getAxiosInstance();
    const response = await axios.get<PaginatedProducts>(
      `${API_BASE}/${pageId}/products`,
      {
        params: {
          searchQuery,
          ...filters,
        },
      }
    );
    return response.data;
  },

  /**
   * Generate presigned URL for product image upload
   */
  // Product images: callers should use `uploadService.uploadImage(file)` from
  // `@/lib/service/upload.service` (Cloudflare Images) and pass the returned URL
  // to whatever endpoint persists the product. Legacy presigned-URL methods removed.
};
