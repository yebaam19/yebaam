import Image from 'next/image'
import { ShieldCheck } from 'lucide-react'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

function cfImageUrl(id: string | null) {
  if (!id || !CF_HASH) return null
  return `https://imagedelivery.net/${CF_HASH}/${id}/public`
}

export interface BusinessHeaderProps {
  name: string
  category: string
  coverCfImageId?: string | null
  description?: string
  rating: number
  reviewsCount: number
  location?: string
  schedule?: string
  isOpen?: boolean
  isVerified?: boolean
  promoLabel?: string
}

export function BusinessHeader({
  name,
  category,
  coverCfImageId,
  description,
  rating,
  reviewsCount,
  location,
  schedule,
  isOpen = true,
  isVerified = false,
  promoLabel,
}: BusinessHeaderProps) {
  const coverUrl = cfImageUrl(coverCfImageId ?? null)

  return (
    <section className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm">
      <div className="relative h-64 overflow-hidden bg-primary-50 md:h-80">
        {coverUrl ? (
          <Image src={coverUrl} alt={name} fill priority className="object-cover" sizes="100vw" />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: 'radial-gradient(circle at 30% 50%, rgba(22,164,76,0.14) 0%, transparent 60%), rgb(240,252,245)' }}
          />
        )}
        <div className="absolute left-5 top-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-700 backdrop-blur-sm">
            {category}
          </span>
          <span className={[
            'rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm',
            isOpen ? 'bg-emerald-500/90 text-white' : 'bg-neutral-200/90 text-neutral-700',
          ].join(' ')}>
            {isOpen ? 'Abierto ahora' : 'Cerrado'}
          </span>
          {promoLabel && (
            <span className="rounded-full bg-secondary-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {promoLabel}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-6 md:px-8">
        <div className="flex gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-lg font-bold text-white shadow-sm">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{name}</h1>
              {isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-800">
                  <ShieldCheck size={12} /> Verificado
                </span>
              )}
            </div>
            {description && (
              <p className="mt-2 text-base leading-7 text-neutral-600">{description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-neutral-500">
              <span className="rounded-full bg-neutral-50 px-3 py-1">
                ⭐ {rating.toFixed(1)} · {reviewsCount} reseñas
              </span>
              {location && <span className="rounded-full bg-neutral-50 px-3 py-1">📍 {location}</span>}
              {schedule && <span className="rounded-full bg-neutral-50 px-3 py-1">🕒 {schedule}</span>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
