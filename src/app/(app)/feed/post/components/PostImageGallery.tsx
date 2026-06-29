'use client';

import { useState } from 'react';
import Image from 'next/image';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import type { MediaFile } from '../interfaces/post.interfaces';

interface PostImageGalleryProps {
  images: MediaFile[];
}

export default function PostImageGallery({ images }: PostImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (images.length === 0) return null;

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Algoritmo de layout según cantidad de imágenes
  const getImageGridLayout = (count: number) => {
    switch (count) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2';
      case 4:
        return 'grid-cols-2';
      case 5:
        return 'grid-cols-3';
      default:
        return 'grid-cols-3';
    }
  };

  const getImageAspect = (count: number, index: number) => {
    /** Altura acotada + contain evita recortes (retratos, 4:3 distinto del box). */
    if (count === 1) return 'min-h-[160px] h-[min(600px,85vh)] w-full';
    if (count === 3 && index === 2) return 'col-span-2 aspect-[2/1]';
    return 'aspect-square';
  };

  return (
    <>
      {/* Grid de imágenes */}
      <div className={cn('grid gap-1', getImageGridLayout(images.length))}>
        {images.map((image, index) => {
          const showMoreOverlay = index === 5 && images.length > 6;
          
          return (
            <div
              key={image.id || image.url}
              className={cn(
                'relative overflow-hidden bg-neutral-100 dark:bg-neutral-800 cursor-pointer group',
                getImageAspect(images.length, index)
              )}
              onClick={() => openLightbox(index)}
            >
              <Image
                src={image.url}
                alt={`Imagen ${index + 1}`}
                fill
                className="object-contain object-center transition-opacity group-hover:opacity-95"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={index === 0}
              />
              
              {showMoreOverlay && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">
                    +{images.length - 6}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          {/* Cerrar */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-50"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {/* Navegación */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronLeftIcon className="w-8 h-8" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronRightIcon className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Imagen actual */}
          <div className="relative w-full h-full flex items-center justify-center p-12">
            <Image
              src={images[currentImageIndex].url}
              alt={`Imagen ${currentImageIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              unoptimized
            />
          </div>

          {/* Contador */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
