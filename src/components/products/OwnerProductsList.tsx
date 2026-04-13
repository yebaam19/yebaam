import { useState } from 'react';
import { PlusIcon } from '@/components/icons/heroicons-shim';
import { PageProduct, ProductFilters } from '@/interfaces/page-product.interface';
import { usePageProducts } from '@/hooks/usePageProducts';
import { OwnerProductCard } from './OwnerProductCard';
import { ProductFiltersBar } from './ProductFiltersBar';
import { CreateProductModal } from './CreateProductModal';
import { EditProductModal } from './EditProductModal';
import { ProductListSkeleton } from './ProductCardSkeleton';

interface OwnerProductsListProps {
  pageId: string;
}

export function OwnerProductsList({ pageId }: OwnerProductsListProps) {
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 12,
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PageProduct | null>(null);

  const { data, isLoading, error } = usePageProducts(pageId, filters);

  const handleEdit = (product: PageProduct) => {
    setEditingProduct(product);
  };

  const handleCloseEdit = () => {
    setEditingProduct(null);
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis Productos</h2>
          <p className="text-gray-600 mt-1">
            Gestiona los productos de tu página
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Filters */}
      <ProductFiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        categories={[]}
      />

      {/* Loading Skeleton */}
      {isLoading && <ProductListSkeleton count={6} />}

      {/* Products Grid - Wider cards with 3 columns max */}
      {!isLoading && data && data.products.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.products.map((product) => (
              <OwnerProductCard
                key={product.id}
                product={product}
                pageId={pageId}
                onEdit={handleEdit}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
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
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 mb-4">No tienes productos aún</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Crear tu primer producto
          </button>
        </div>
      )}

      {/* Create Modal */}
      <CreateProductModal
        pageId={pageId}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Modal */}
      {editingProduct && (
        <EditProductModal
          pageId={pageId}
          product={editingProduct}
          isOpen={!!editingProduct}
          onClose={handleCloseEdit}
        />
      )}
    </div>
  );
}
