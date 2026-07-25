import { PageProduct } from '@/interfaces/page-product.interface';
import { ProductPriceDisplay } from './ProductPriceDisplay';
import { ProductStockBadge } from './ProductStockBadge';
import Image from 'next/image';

interface PublicProductCardProps {
  product: PageProduct;
  onClick?: () => void;
}

export function PublicProductCard({ product, onClick }: PublicProductCardProps) {
  const hasPromotion = product.promotion?.isActive;
  const hasMultipleImages = product.images.length > 1;

  return (
    <div 
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {product.images.length > 0 ? (
          <>
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt || product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              unoptimized
            />
            
            {/* Multiple Images Indicator */}
            {hasMultipleImages && (
              <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                </svg>
                {product.images.length}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">Sin imagen</span>
          </div>
        )}
        
        {/* Promotion Badge */}
        {hasPromotion && (
          <div className="absolute top-3 left-3 bg-linear-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg animate-pulse">
            {product.promotion!.discountType === 'percentage' 
              ? `-${product.promotion!.discountValue}%`
              : '¡OFERTA!'
            }
          </div>
        )}

        {/* Quick View Hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-gray-900 shadow-lg">
            Ver detalles
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-12 text-base group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        
        {/* Description */}
        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Category */}
        {product.category && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="font-medium">{product.category.main}</span>
            {product.category.sub && <span>• {product.category.sub}</span>}
          </div>
        )}

        {/* Price and Stock */}
        <div className="pt-2 space-y-2 border-t border-gray-100">
          <ProductPriceDisplay product={product} size="md" showBadge={false} />
          <ProductStockBadge stock={product.stock} size="sm" />
        </div>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {product.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md font-medium"
              >
                #{tag}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                +{product.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
