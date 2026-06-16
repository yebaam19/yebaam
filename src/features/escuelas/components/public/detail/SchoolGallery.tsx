'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { cfImageUrl } from './SchoolHero'
import type { MediaAsset } from '../../../types'

interface Props { assets: MediaAsset[] }

export function SchoolGallery({ assets }: Props) {
  const images = assets.filter(
    (a) => a.cf_image_id && !['VIDEO_URL', 'VIDEO', 'REEL'].includes(a.type)
  ).slice(0, 12)

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (images.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-primary-200 bg-white p-10 text-center">
        <p className="text-base font-black text-neutral-950">Sin galería publicada</p>
        <p className="mt-2 text-sm text-neutral-500">La escuela todavía no ha subido imágenes.</p>
      </div>
    )
  }

  function prev() { setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null)) }
  function next() { setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : null)) }

  return (
    <>
      {/* Bento grid: items at index 0 and 5 span 2 cols + 2 rows */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((asset, index) => {
          const imgUrl = cfImageUrl(asset.cf_image_id)!
          const isBig = index === 0 || index === 5
          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className={[
                'group relative overflow-hidden rounded-xl bg-primary-50 transition duration-300',
                isBig ? 'sm:col-span-2 sm:row-span-2' : '',
              ].join(' ')}
            >
              <Image
                src={imgUrl}
                alt={asset.caption ?? asset.title ?? 'Imagen de la escuela'}
                fill
                className="aspect-[4/3] h-full w-full object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/35" />
              <Maximize2 size={16} className="absolute right-3 top-3 text-white opacity-0 transition group-hover:opacity-100" />
            </button>
          )
        })}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (() => {
        const asset = images[lightboxIndex]
        const imgUrl = cfImageUrl(asset?.cf_image_id ?? null)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 p-4"
            onClick={() => setLightboxIndex(null)}>
            <button onClick={() => setLightboxIndex(null)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25">
              <X size={20} />
            </button>
            {images.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); prev() }}
                  className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); next() }}
                  className="absolute right-16 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25">
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            <div className="relative max-h-[85vh] max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
              {imgUrl ? (
                <Image src={imgUrl} alt={asset?.caption ?? 'Imagen'} width={1400} height={900}
                  className="mx-auto max-h-[80vh] w-auto rounded-2xl object-contain" />
              ) : (
                <div className="flex h-64 items-center justify-center rounded-2xl bg-neutral-800 text-white/50">Sin preview</div>
              )}
              {(asset?.caption || asset?.title) && (
                <p className="mt-3 text-center text-sm text-white/70">{asset.caption || asset.title}</p>
              )}
            </div>
          </div>
        )
      })()}
    </>
  )
}
