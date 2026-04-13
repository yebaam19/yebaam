import { useState, useCallback } from 'react';
import { XMarkIcon, PhotoIcon, ArrowUpTrayIcon } from '@/components/icons/heroicons-shim';
import Image from 'next/image';
import { useProductImageUpload } from '@/hooks/useProductImageUpload';
import { toast } from 'sonner';

interface ProductImage {
  url: string;
  s3Key?: string;
  alt?: string;
  isPrimary?: boolean;
}

interface ProductImagesUploadProps {
  pageId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
}

export function ProductImagesUpload({
  pageId,
  images,
  onImagesChange,
  maxImages = 5,
}: ProductImagesUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { uploadImage, isUploading } = useProductImageUpload(pageId);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) {
        toast.error(`Máximo ${maxImages} imágenes permitidas`);
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      
      // Upload each file to S3
      const newImages: ProductImage[] = [];
      for (const file of filesToUpload) {
        try {
          console.log('[ProductImagesUpload] Uploading file:', file.name);
          const { url, s3Key } = await uploadImage(file);
          newImages.push({
            url,
            s3Key,
            alt: file.name,
            isPrimary: images.length === 0 && newImages.length === 0,
          });
          console.log('[ProductImagesUpload] File uploaded successfully:', { url, s3Key });
        } catch (error) {
          console.error('[ProductImagesUpload] Failed to upload file:', file.name, error);
          toast.error(`Error al subir ${file.name}`);
        }
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast.success(`${newImages.length} imagen(es) subida(s) correctamente`);
      }
    }, [images, maxImages, onImagesChange, uploadImage, pageId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    }, [handleFileSelect]);

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    if (images[index].isPrimary && newImages.length > 0) newImages[0].isPrimary = true;
    onImagesChange(newImages);
  };

  const handleSetPrimary = (index: number) => {
    onImagesChange(images.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={images.length >= maxImages || isUploading}
          className="hidden"
          id="product-images-input"
        />
        <label
          htmlFor="product-images-input"
          className={`flex flex-col items-center ${images.length >= maxImages ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {isUploading ? <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 animate-pulse" /> : <PhotoIcon className="w-12 h-12 text-gray-400" />}
          <p className="mt-2 text-sm text-gray-600">{isUploading ? 'Subiendo...' : 'Arrastra imágenes o haz clic para seleccionar'}</p>
          <p className="text-xs text-gray-500 mt-1">{images.length}/{maxImages} imágenes • PNG, JPG hasta 5MB</p>
        </label>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors"
            >
              <Image
                src={image.url}
                alt={image.alt || `Producto ${index + 1}`}
                fill
                className="object-cover"
              />
              
              {/* Primary Badge */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  Principal
                </div>
              )}

              {/* Actions Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(index)}
                    className="px-3 py-1 bg-white text-gray-900 rounded text-sm hover:bg-gray-100"
                  >
                    Principal
                  </button>
                )}
                <button
                  onClick={() => handleRemove(index)}
                  className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
