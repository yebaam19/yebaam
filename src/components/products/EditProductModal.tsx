import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import { useForm } from 'react-hook-form';
import { PageProduct, CreateProductDto } from '@/interfaces/page-product.interface';
import { useUpdateProduct } from '@/hooks/usePageProducts';
import { ProductFormFields } from './ProductFormFields';
import { ProductImagesUpload } from './ProductImagesUpload';
import { PromotionSelector } from './PromotionSelector';

interface EditProductModalProps {
  pageId: string;
  product: PageProduct;
  isOpen: boolean;
  onClose: () => void;
}

export function EditProductModal({
  pageId,
  product,
  isOpen,
  onClose,
}: EditProductModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<Array<{ url: string; s3Key?: string; alt?: string; isPrimary?: boolean }>>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | undefined>();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateProductDto>();

  const { mutateAsync: updateProduct } = useUpdateProduct(pageId, product.id);

  // Load product data when modal opens
  useEffect(() => {
    if (isOpen && product) {
      // Set form values
      setValue('name', product.name);
      if (product.description) setValue('description', product.description);
      setValue('price', product.price.amount);
      setValue('compareAtPrice', product.price.compareAtAmount);
      setValue('currency', product.price.currency);
      if (product.category?.main) setValue('categoryMain', product.category.main);
      if (product.category?.sub) setValue('categorySub', product.category.sub);
      if (product.sku) setValue('sku', product.sku);
      if (product.weight) setValue('weight', product.weight);
      setValue('isActive', product.isActive);
      
      // Set stock values
      if (product.stock) {
        setValue('stock', {
          quantity: product.stock.quantity,
          trackInventory: product.stock.trackInventory,
          allowBackorder: product.stock.allowBackorder,
        });
      }

      // Set dimensions if they exist
      if (product.dimensions) {
        setValue('dimensions', product.dimensions);
      }

      // Set tags
      setValue('tags', product.tags);

      // Set images
      if (product.images) {
        setImages(product.images.map(img => ({
          url: img.url,
          s3Key: img.s3Key,
          alt: img.alt,
          isPrimary: img.order === 0,
        })));
      }

      // Set promotion if exists
      if (product.promotion) {
        setSelectedPromotionId(product.promotion.promotionId);
      }
    }
  }, [isOpen, product, setValue]);

  const onSubmit = async (data: CreateProductDto) => {
    try {
      setSubmitting(true);
      
      // Clean up optional fields
      const cleanedData: any = {
        name: data.name,
        price: data.price,
        currency: data.currency || 'USD',
        isActive: data.isActive !== false,
        
        // Optional price
        compareAtPrice: data.compareAtPrice && data.compareAtPrice > 0 ? data.compareAtPrice : undefined,
        
        // Optional text fields
        description: data.description?.trim() || undefined,
        categoryMain: data.categoryMain?.trim() || undefined,
        categorySub: data.categorySub?.trim() || undefined,
        sku: data.sku?.trim() || undefined,
        
        // Optional numeric
        weight: data.weight && data.weight > 0 ? data.weight : undefined,
        
        // Optional dimensions
        dimensions: (data.dimensions?.length && data.dimensions?.width && data.dimensions?.height)
          ? data.dimensions
          : undefined,
        
        // Stock
        stock: data.stock,
        
        // Tags
        tags: data.tags || [],
        
        // Images with order
        images: images.map((img, index) => ({
          url: img.url,
          s3Key: img.s3Key,
          alt: img.alt || '',
          order: img.isPrimary ? 0 : index + 1,
        })),
      };

      await updateProduct(cleanedData);
      handleClose();
    } catch (error) {
      console.error('Error updating product:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setImages([]);
    setSelectedPromotionId(undefined);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose} static>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all max-h-[90vh] flex flex-col">
                {/* Header - Sticky */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    Editar Producto
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Form - Scrollable content */}
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    <ProductFormFields
                      register={register}
                      errors={errors}
                      showAdvancedFields
                    />

                    <ProductImagesUpload
                      pageId={pageId}
                      images={images}
                      onImagesChange={setImages}
                    />

                    <PromotionSelector
                      pageId={pageId}
                      selectedPromotionId={selectedPromotionId}
                      onPromotionSelect={setSelectedPromotionId}
                    />
                  </div>

                  {/* Actions - Sticky footer */}
                  <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
