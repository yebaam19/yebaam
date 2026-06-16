'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Music } from 'lucide-react'
import { cfImageUrl } from './ArtistHeader'
import type { PortfolioItem } from '../../../types'

const MEDIA_LABEL: Record<string, string> = {
  IMAGE: 'Imagen', VIDEO: 'Video', AUDIO: 'Audio', DOCUMENT: 'Documento', LINK: 'Enlace',
}
const MEDIA_COLOR: Record<string, string> = {
  IMAGE: 'bg-primary-50 text-primary-700',
  VIDEO: 'bg-secondary-50 text-secondary-700',
  AUDIO: 'bg-yellow-50 text-yellow-700',
  DOCUMENT: 'bg-neutral-100 text-neutral-600',
  LINK: 'bg-primary-50 text-primary-600',
}

interface Props { items: PortfolioItem[] }

export function ArtistPortfolio({ items }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-primary-200 bg-primary-50/40 p-10 text-center">
        <p className="text-base font-semibold text-neutral-900">Sin piezas de portafolio</p>
        <p className="mt-2 text-sm text-neutral-500">Este artista no ha publicado portafolio aún.</p>
      </div>
    )
  }

  function prev() { setLightboxIndex((i) => (i !== null ? (i - 1 + items.length) % items.length : null)) }
  function next() { setLightboxIndex((i) => (i !== null ? (i + 1) % items.length : null)) }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item, index) => {
          const imgUrl = cfImageUrl(item.cf_image_id)
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative h-44 overflow-hidden bg-primary-50">
                {imgUrl ? (
                  <Image src={imgUrl} alt={item.title} fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 50vw" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-primary-50">
                    <Music size={32} className="text-primary-700" />
                  </div>
                )}
                {item.is_featured && (
                  <span className="absolute right-2 top-2 rounded-full bg-secondary-700 px-2 py-0.5 text-xs font-bold text-white">
                    Destacada
                  </span>
                )}
              </div>
              <div className="p-4">
                <span className={['mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold',
                  MEDIA_COLOR[item.media_type] ?? 'bg-neutral-100 text-neutral-600'].join(' ')}>
                  {MEDIA_LABEL[item.media_type] ?? item.media_type}
                </span>
                <h3 className="font-black text-neutral-950">{item.title}</h3>
                {item.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-neutral-500">{item.description}</p>
                )}
                {item.tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 border border-primary-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 p-4"
            onClick={() => setLightboxIndex(null)}>
            <button onClick={() => setLightboxIndex(null)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25">
              <X size={20} />
            </button>
            {items.length > 1 && (
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
            <div className="relative max-h-[85vh] max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
              {imgUrl ? (
                <Image src={imgUrl} alt={item?.title || 'Pieza'} width={1200} height={800}
                  className="mx-auto max-h-[75vh] w-auto rounded-2xl object-contain" />
              ) : (
                <div className="flex h-64 items-center justify-center rounded-2xl bg-neutral-800 text-white/60">
                  Sin preview disponible
                </div>
              )}
              {item?.title && <p className="mt-3 text-center text-sm text-white/70">{item.title}</p>}
              {item?.description && <p className="mt-1 text-center text-xs text-white/50">{item.description}</p>}
            </div>
          </div>
        )
      })()}
    </>
  )
}
