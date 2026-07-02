'use client';

/**
 * Wireframe row 3: the 3-slot photo/video strip. Photos open a lightbox;
 * videos swap in-place for the Cloudflare Stream player (mobile-friendly,
 * no dialog juggling).
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PlayIcon } from '@/components/icons/heroicons-shim';
import { streamThumb } from '@/lib/media/urls';
import { StreamVideo } from '@/components/media/StreamVideo';
import type { EmprendimientoMediaItem } from '@/features/cities/server/emprendimientos.server';
import { MediaLightbox } from './MediaLightbox';

interface Props {
  items: EmprendimientoMediaItem[];
}

export function MediaStrip({ items }: Props) {
  const t = useTranslations('cities.emprendimientos.detail');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  if (items.length === 0) return null;
  const images = items.filter((m) => m.type === 'IMAGE' && m.imageUrl);

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
        {t('mediaTitle')}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {items.map((item) => {
          const frame =
            'relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900';

          if (item.type === 'VIDEO' && item.cfStreamUid) {
            if (playingVideoId === item.id) {
              return (
                <div key={item.id} className={frame}>
                  <StreamVideo
                    uid={item.cfStreamUid}
                    autoplay
                    muted
                    aspectRatio="4 / 3"
                    className="h-full w-full"
                  />
                </div>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPlayingVideoId(item.id)}
                aria-label={t('playVideo')}
                className={`${frame} group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`}
              >
                <img
                  src={streamThumb(item.cfStreamUid, { time: 1 })}
                  alt={item.caption ?? ''}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-105">
                    <PlayIcon className="h-5 w-5 translate-x-[1px] text-neutral-900" />
                  </span>
                </span>
              </button>
            );
          }

          if (!item.imageUrl) return null;
          const imageIndex = images.findIndex((img) => img.id === item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightboxIndex(imageIndex)}
              aria-label={t('openImage', { index: imageIndex + 1, total: images.length })}
              className={`${frame} group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`}
            >
              <img
                src={item.imageUrl}
                alt={item.caption ?? ''}
                className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                loading="lazy"
              />
            </button>
          );
        })}
      </div>
      {lightboxIndex !== null && images.length > 0 && (
        <MediaLightbox
          images={images}
          index={Math.max(0, Math.min(lightboxIndex, images.length - 1))}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </section>
  );
}
