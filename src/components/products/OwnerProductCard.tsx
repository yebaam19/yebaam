import { useState } from 'react';
import { PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { PageProduct } from '@/interfaces/page-product.interface';
import { useUpdateProduct, useDeleteProduct } from '@/hooks/usePageProducts';
import { ProductPriceDisplay } from './ProductPriceDisplay';
import { ProductStockBadge } from './ProductStockBadge';
import Image from 'next/image';

interface OwnerProductCardProps {
  product: PageProduct;
  pageId: string;
  onEdit: (product: PageProduct) => void;
}

export function OwnerProductCard({
  product,
  pageId,
  onEdit,
}: OwnerProductCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { mutateAsync: updateProduct } = useUpdateProduct(pageId, product.id);
  const { mutateAsync: deleteProduct } = useDeleteProduct(pageId);

  const hasMultipleImages = product.images && product.images.length > 1;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleToggleActive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsToggling(true);
      await updateProduct({ isActive: !product.isActive });
    } catch (error) {
      console.error('Error toggling product status:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) return;

    try {
      setIsDeleting(true);
      await deleteProduct(product.id);
    } catch (error) {
      console.error('Error deleting product:', error);
      setIsDeleting(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(product);
  };

  return (
    <div 
      className={`group relative border rounded-xl overflow-hidden transition-all duration-300 ${
        product.isActive 
          ? 'bg-white border-gray-200 hover:shadow-xl hover:border-blue-300' 
          : 'bg-gray-50 border-gray-300 opacity-75 hover:opacity-100'
      }`}
    >
      {/* Inactive Overlay Hint */}
      {!product.isActive && (
        <div className="absolute inset-0 bg-gray-900/5 pointer-events-none z-10" />
      )}

      {/* Image Container - Increased height */}
      <div className="relative h-64 bg-gray-100 overflow-hidden group/image">
        {product.images?.[0] ? (
          <>
            <Image
              src={product.images[currentImageIndex].url}
              alt={product.images[currentImageIndex].alt || product.name}
              fill
              className={`object-cover transition-all duration-500 ${
                product.isActive ? 'group-hover:scale-105' : 'grayscale'
              }`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            
            {/* Image Navigation - Only show if multiple images */}
            {hasMultipleImages && (
              <>
                {/* Previous Button */}
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity z-20"
                  title="Imagen anterior"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>

                {/* Next Button */}
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity z-20"
                  title="Siguiente imagen"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>

                {/* Image Indicators/Dots */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                  {product.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex
                          ? 'bg-white w-6'
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      title={`Imagen ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Image Counter Badge */}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium">
                  {currentImageIndex + 1} / {product.images.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <svg className="w-12 h-12 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Sin imagen</span>
          </div>
        )}
        
        {/* Active/Inactive Toggle Button */}
        <div className="absolute top-2 right-2 z-20">
          <button
            onClick={handleToggleActive}
            disabled={isToggling}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-lg transition-all duration-200 ${
              product.isActive
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-700 text-white hover:bg-gray-800'
            } disabled:opacity-50`}
            title={product.isActive ? 'Click para ocultar' : 'Click para mostrar'}
          >
            {isToggling ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : product.isActive ? (
              <EyeIcon className="w-3.5 h-3.5" />
            ) : (
              <EyeSlashIcon className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{product.isActive ? 'Visible' : 'Oculto'}</span>
          </button>
        </div>

        {/* Promotion Badge */}
        {product.promotion?.isActive && (
          <div className="absolute top-2 left-2 bg-linear-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-md text-xs font-bold">
            PROMOCIÓN
          </div>
        )}
      </div>

      {/* Content - More spacious */}
      <div className="p-4 space-y-3">
        {/* Title and Description */}
        <div className="min-h-20">
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-base leading-tight mb-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
          {product.category && (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {product.category.main}
            </p>
          )}
        </div>

        {/* Price and Stock */}
        <div className="space-y-2 py-2 border-t border-gray-200">
          <ProductPriceDisplay product={product} size="md" showBadge />
          <ProductStockBadge stock={product.stock} size="sm" />
        </div>

        {/* Action Buttons - Full width and prominent */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200">
          <button
            onClick={handleEdit}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium shadow-sm"
            title="Editar producto"
          >
            <PencilIcon className="w-5 h-5" />
            <span className="text-sm font-semibold">Editar</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            title="Eliminar producto"
          >
            <TrashIcon className="w-5 h-5" />
            <span className="text-sm font-semibold">{isDeleting ? 'Borrando...' : 'Eliminar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
