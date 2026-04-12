/**
 * Product Price Interface
 */
export interface ProductPrice {
  amount: number;
  currency: string;
  compareAtAmount?: number;
  hasDiscount?: boolean;
  discountPercentage?: number;
}

/**
 * Product Category Interface
 */
export interface ProductCategory {
  main: string;
  sub?: string;
  fullPath: string;
}

/**
 * Product Stock Interface
 */
export interface ProductStock {
  quantity: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  isInStock: boolean;
  isLowStock?: boolean;
}

/**
 * Product Image Interface
 */
export interface ProductImage {
  url: string;
  s3Key?: string;
  alt?: string;
  order: number;
}

/**
 * Product Promotion Interface
 */
export interface ProductPromotion {
  promotionId: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: Date | string;
  endDate: Date | string;
  isActive: boolean;
}

/**
 * Product Dimensions Interface
 */
export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
}

/**
 * Main Product Interface
 */
export interface PageProduct {
  id: string;
  pageId: string;
  name: string;
  description?: string;
  price: ProductPrice;
  finalPrice?: ProductPrice;
  category?: ProductCategory;
  images: ProductImage[];
  stock: ProductStock;
  promotion?: ProductPromotion;
  isActive: boolean;
  isAvailableForPurchase: boolean;
  tags: string[];
  sku?: string;
  weight?: number;
  dimensions?: ProductDimensions;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Paginated Products Response
 */
export interface PaginatedProducts {
  products: PageProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Create Product DTO
 */
export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency?: string;
  categoryMain: string;
  categorySub?: string;
  images?: ProductImage[];
  stock?: {
    quantity?: number;
    trackInventory?: boolean;
    allowBackorder?: boolean;
  };
  tags?: string[];
  sku?: string;
  weight?: number;
  dimensions?: ProductDimensions;
  isActive?: boolean;
}

/**
 * Update Product DTO
 */
export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  currency?: string;
  categoryMain?: string;
  categorySub?: string;
  images?: ProductImage[];
  stock?: {
    quantity?: number;
    trackInventory?: boolean;
    allowBackorder?: boolean;
  };
  tags?: string[];
  sku?: string;
  weight?: number;
  dimensions?: ProductDimensions;
  isActive?: boolean;
}

/**
 * Product Filters for Query
 */
export interface ProductFilters {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'price' | 'name';
  sortOrder?: 'asc' | 'desc';
  categoryMain?: string;
  categorySub?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  hasPromotion?: boolean;
  tags?: string;
  searchQuery?: string;
  isActive?: boolean;
}

/**
 * Apply Promotion DTO
 */
export interface ApplyPromotionDto {
  promotionId: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: Date | string;
  endDate: Date | string;
}
