'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cfImageUrl } from './BusinessHero'
import type { MediaAsset } from '../../../types'

interface Props {
  assets: MediaAsset[]
}

export function BusinessGallery({ assets }: Props) {
  const items = assets.filter((a) => a.cf_image_id || a.cf_video_uid).slice(0, 12)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <h3 className="text-lg font-semibold text-neutral-900">Aún no hay contenido visual</h3>
        <p className="mt-2 text-sm text-neutral-500">
          Cuando el negocio publique fotos o videos, los verás aquí.
        </p>
      </div>
    )
  }

  function prev() {
    setLightboxIndex((i) => (i !== null ? (i - 1 + items.length) % items.length : null))
  }
  function next() {
    setLightboxIndex((i) => (i !== null ? (i + 1) % items.length : null))
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item, index) => {
          const imgUrl = cfImageUrl(item.cf_image_id)
          const isVideo = item.type === 'VIDEO' || item.type === 'REEL'

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative h-56 bg-primary-50">
                {imgUrl ? (
                  <Image
                    src={imgUrl} alt={item.alt_text || item.title || 'Foto del negocio'} fill
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl bg-primary-50">
                    {isVideo ? '🎬' : '📷'}
                  </div>
                )}
                {/* Type badge */}
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-neutral-700 backdrop-blur-sm">
                  {isVideo ? 'Video' : 'Imagen'}
                </span>
                {item.is_primary && (
                  <span className="absolute right-3 top-3 rounded-full bg-secondary-700/90 px-2.5 py-0.5 text-xs font-bold text-white">
                    Principal
                  </span>
                )}
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/20">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-xl font-bold text-neutral-900 shadow-lg">
                      ▶
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="line-clamp-1 text-sm font-semibold text-neutral-900">
                  {item.title || (isVideo ? 'Video del negocio' : 'Foto del negocio')}
                </p>
                <p className="mt-1 text-xs text-neutral-500">Abrir en detalle</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (() => {
        const item = items[lightboxIndex]
        const imgUrl = cfImageUrl(item?.cf_image_id ?? null)
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
              onClick={() => setLightboxIndex(null)}
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
            {items.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); prev() }}
                  className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
                  aria-label="Anterior">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); next() }}
                  className="absolute right-16 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
                  aria-label="Siguiente">
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            <div className="relative max-h-[85vh] max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              {imgUrl ? (
                <Image
                  src={imgUrl} alt={item?.title || 'Imagen'} width={1200} height={800}
                  className="max-h-[85vh] w-auto mx-auto rounded-2xl object-contain"
                  unoptimized
                />
              ) : (
                <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-neutral-800 text-white/60">
                  Sin preview disponible
                </div>
              )}
              {item?.title && (
                <p className="mt-3 text-center text-sm text-white/70">{item.title}</p>
              )}
            </div>
          </div>
        )
      })()}
    </>
  )
}
