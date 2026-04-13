import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import { useForm } from 'react-hook-form';
import { CreateProductDto } from '@/interfaces/page-product.interface';
import { useCreateProduct } from '@/hooks/usePageProducts';
import { ProductFormFields } from './ProductFormFields';
import { ProductImagesUpload } from './ProductImagesUpload';
import { PromotionSelector } from './PromotionSelector';

interface CreateProductModalProps {
  pageId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProductModal({
  pageId,
  isOpen,
  onClose,
}: CreateProductModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<Array<{ url: string; s3Key?: string; alt?: string; isPrimary?: boolean }>>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | undefined>();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateProductDto>({
    defaultValues: {
      currency: 'USD',
      isActive: true,
      stock: {
        quantity: 0,
        trackInventory: false, // No rastrear inventario por defecto
        allowBackorder: true,  // Permitir pedidos sin stock por defecto
      },
    },
  });

  const { mutateAsync: createProduct } = useCreateProduct(pageId);

  const onSubmit = async (data: CreateProductDto) => {
    try {
      setSubmitting(true);
      
      // Clean up optional fields - remove empty strings, 0, null, undefined
      const cleanedData: any = {
        ...data,
        // Required fields
        name: data.name,
        price: data.price,
        currency: data.currency || 'USD',
        isActive: data.isActive !== false,
        
        // Optional price
        compareAtPrice: data.compareAtPrice && data.compareAtPrice > 0 ? data.compareAtPrice : undefined,
        
        // Optional text fields - remove empty strings
        description: data.description?.trim() || undefined,
        categoryMain: data.categoryMain?.trim() || undefined,
        categorySub: data.categorySub?.trim() || undefined,
        sku: data.sku?.trim() || undefined,
        
        // Images with s3Key
        images: images.map((img, index) => ({
          url: img.url,
          s3Key: img.s3Key,
          alt: img.alt || `Product image ${index + 1}`,
          order: index
        })),
        
        // Stock
        stock: {
          quantity: data.stock?.quantity || 0,
          trackInventory: data.stock?.trackInventory || false,
          allowBackorder: data.stock?.allowBackorder !== false,
        },
        
        // Optional numeric fields
        weight: data.weight && data.weight > 0 ? data.weight : undefined,
      };
      
      await createProduct(cleanedData);
      reset();
      setImages([]);
      setSelectedPromotionId(undefined);
      onClose();
    } catch (error) {
      console.error('Error creating product:', error);
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
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={handleClose} className="relative z-50" static>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
                  {/* Header - Sticky */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                    <Dialog.Title className="text-xl font-semibold text-gray-900">Crear Producto</Dialog.Title>
                    <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Content - Scrollable */}
                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes del Producto</label>
                      <ProductImagesUpload pageId={pageId} images={images} onImagesChange={setImages} maxImages={5} />
                    </div>
                    <ProductFormFields register={register} errors={errors} />
                    <PromotionSelector pageId={pageId} selectedPromotionId={selectedPromotionId} onPromotionSelect={setSelectedPromotionId} />
                  </div>

                  {/* Footer - Sticky */}
                  <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={handleClose} 
                      disabled={submitting} 
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      disabled={submitting} 
                      className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? 'Creando...' : 'Crear Producto'}
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
