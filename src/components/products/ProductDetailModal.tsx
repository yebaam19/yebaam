import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, TagIcon } from '@/components/icons/heroicons-shim';
import { PageProduct } from '@/interfaces/page-product.interface';
import { ProductImageGallery } from './ProductImageGallery';
import { ProductPriceDisplay } from './ProductPriceDisplay';
import { ProductStockBadge } from './ProductStockBadge';

interface ProductDetailModalProps {
  product: PageProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
}: ProductDetailModalProps) {
  if (!product) return null;

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>

        {/* Modal Panel */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-4xl w-full bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <Dialog.Title className="text-xl font-semibold">
                  {product.name}
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left - Images */}
                <ProductImageGallery images={product.images} productName={product.name} />

                {/* Right - Details */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <ProductPriceDisplay product={product} size="lg" showBadge />
                    <ProductStockBadge stock={product.stock} size="md" />
                  </div>

                  {/* Description */}
                  {product.description && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
                      <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
                    </div>
                  )}

                  {/* Category */}
                  {product.category && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Categoría</h3>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">{product.category.main}</span>
                        {product.category.sub && (
                          <>
                            <span className="text-gray-400">›</span>
                            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">{product.category.sub}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <TagIcon className="w-5 h-5" />
                        Etiquetas
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
                    {product.sku && <div className="flex justify-between"><span>SKU:</span><span className="font-mono">{product.sku}</span></div>}
                    {product.weight && <div className="flex justify-between"><span>Peso:</span><span>{product.weight}kg</span></div>}
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
