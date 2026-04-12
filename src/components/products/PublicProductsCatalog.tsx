import { useState } from 'react';
import { PageProduct, ProductFilters } from '@/interfaces/page-product.interface';
import { usePageProducts } from '@/hooks/usePageProducts';
import { PublicProductCard } from './PublicProductCard';
import { ProductFiltersBar } from './ProductFiltersBar';
import { default as ProductDetailModal } from './ProductDetailModal';

interface PublicProductsCatalogProps {
  pageId: string;
  initialFilters?: Partial<ProductFilters>;
}

export function PublicProductsCatalog({
  pageId,
  initialFilters = {},
}: PublicProductsCatalogProps) {
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 12,
    isActive: true, // Only show active products in public catalog
    ...initialFilters,
  });

  const [selectedProduct, setSelectedProduct] = useState<PageProduct | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data, isLoading, error } = usePageProducts(pageId, filters);

  const handleProductClick = (product: PageProduct) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedProduct(null);
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error al cargar productos</p>
        <p className="text-sm text-gray-500 mt-2">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <ProductFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        categories={[]} // Could be fetched from backend or passed as prop
      />

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 animate-pulse rounded-lg h-80"
            />
          ))}
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && data && data.products.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.products.map((product) => (
              <PublicProductCard
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product)}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(data.page - 1)}
                disabled={data.page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {data.page} de {data.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(data.page + 1)}
                disabled={data.page === data.totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && data && data.products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron productos</p>
          {filters.searchQuery && (
            <button
              onClick={() => setFilters({ ...filters, searchQuery: undefined })}
              className="mt-4 text-blue-600 hover:underline"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
