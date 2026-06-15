'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
} from '@/components/icons/heroicons-shim';

interface ClubPhotoLightboxProps {
  url: string;
  index: number;
  total: number;
  liked: boolean;
  count: number;
  pending: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleLike: () => void;
}

/** Full-screen viewer for a club photo: enlarge + like + prev/next + Esc/arrows. */
export function ClubPhotoLightbox({
  url,
  index,
  total,
  liked,
  count,
  pending,
  onClose,
  onPrev,
  onNext,
  onToggleLike,
}: ClubPhotoLightboxProps) {
  const hasMany = total > 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && hasMany) onPrev();
      else if (e.key === 'ArrowRight' && hasMany) onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasMany, onClose, onPrev, onNext]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Foto del club"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
      >
        <XMarkIcon className="h-6 w-6" />
      </button>

      {/* Prev / Next */}
      {hasMany && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            aria-label="Anterior"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <ChevronLeftIcon className="h-7 w-7" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            aria-label="Siguiente"
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <ChevronRightIcon className="h-7 w-7" />
          </button>
        </>
      )}

      {/* Image + controls (stop backdrop close on inner click) */}
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full grow" style={{ height: 'min(78vh, calc(100vh - 160px))' }}>
          <Image
            src={url}
            alt={`Foto ${index + 1} de ${total}`}
            fill
            sizes="90vw"
            className="object-contain"
            unoptimized
            priority
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onToggleLike}
            disabled={pending}
            aria-pressed={liked}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
              liked
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            <HeartIcon className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
            {liked ? 'Te gusta' : 'Me gusta'}
            {count > 0 && <span className="tabular-nums">· {count}</span>}
          </button>
          {hasMany && (
            <span className="text-xs text-white/70 tabular-nums">
              {index + 1} / {total}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
