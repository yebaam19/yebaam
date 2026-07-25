'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon } from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';

interface Props {
  coverCfImageId: string;
  title: string;
}

/** Album detail hero cover — full artwork visible (object-contain) with in-app lightbox on click. */
export function AlbumCoverHero({ coverCfImageId, title }: Props) {
  const tAlbum = useTranslations('musica');
  const tMedia = useTranslations('musica.media');
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const coverUrl = imageUrl(coverCfImageId, 'public');
  const coverAlt = tAlbum('album.coverAlt', { title });

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={tMedia('openLightboxAria')}
        className="block w-full cursor-zoom-in transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        <img
          src={coverUrl}
          alt={coverAlt}
          fetchPriority="high"
          className="aspect-square w-full object-contain"
          decoding="async"
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={coverAlt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={close}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label={tMedia('closeLightboxAria')}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          <img
            src={coverUrl}
            alt={coverAlt}
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
            decoding="async"
            loading="lazy"
          />
        </div>
      )}
    </>
  );
}
