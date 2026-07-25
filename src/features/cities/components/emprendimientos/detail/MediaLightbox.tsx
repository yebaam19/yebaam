'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@/components/icons/heroicons-shim';
import type { EmprendimientoMediaItem } from '@/features/cities/server/emprendimientos.server';

interface Props {
  images: EmprendimientoMediaItem[];
  index: number;
  onIndexChange: (next: number) => void;
  onClose: () => void;
}

/** Minimal accessible photo lightbox: Escape closes, arrows navigate. */
export function MediaLightbox({ images, index, onIndexChange, onClose }: Props) {
  const t = useTranslations('cities.emprendimientos.detail');
  const closeRef = useRef<HTMLButtonElement>(null);
  const current = images[index];

  const prev = useCallback(() => {
    onIndexChange((index - 1 + images.length) % images.length);
  }, [index, images.length, onIndexChange]);
  const next = useCallback(() => {
    onIndexChange((index + 1) % images.length);
  }, [index, images.length, onIndexChange]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  if (!current?.imageUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('openImage', { index: index + 1, total: images.length })}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={t('closeLightbox')}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="←"
            className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="→"
            className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </>
      )}
      <img
        src={current.imageUrl}
        alt={current.caption ?? ''}
        className="max-h-[85vh] max-w-full rounded-xl object-contain"
        onClick={(e) => e.stopPropagation()}
        decoding="async"
        loading="lazy"
      />
    </div>
  );
}
