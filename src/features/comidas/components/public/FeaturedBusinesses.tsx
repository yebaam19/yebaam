import Link from 'next/link'
import Image from 'next/image'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

// Tarjetas de grid: la variante `thumbnail` (~20KB) rinde igual que `/public` (~87KB).
function cfImageUrl(id: string | null) {
  if (!id || !CF_HASH) return null
  return `https://imagedelivery.net/${CF_HASH}/${id}/thumbnail`
}

export interface FeaturedBusinessItem {
  id: string
  slug: string
  name: string
  category: string
  avg_rating: number
  review_count: number
  profile_cf_image_id?: string | null
  description?: string | null
  promoLabel?: string
}

export interface FeaturedBusinessesProps {
  items: FeaturedBusinessItem[]
}

export function FeaturedBusinesses({ items }: FeaturedBusinessesProps) {
  if (items.length === 0) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Destacados</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-neutral-950">
          Negocios que se entienden desde el primer vistazo
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
          Una selección con información clara, reputación visible y ruta directa a la carta.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((business) => {
          const imageUrl = cfImageUrl(business.profile_cf_image_id ?? null)
          return (
            <Link
              key={business.id}
              href={`/negocios/${business.slug}` as never}
              className="group overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative h-56 overflow-hidden bg-primary-50">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={business.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-neutral-100">
                    <span className="text-4xl">🍽️</span>
                  </div>
                )}
                <div className="absolute left-4 top-4 flex gap-2">
                  <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-neutral-700 backdrop-blur-sm">
                    {business.category}
                  </span>
                  {business.promoLabel && (
                    <span className="rounded-full bg-emerald-500/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {business.promoLabel}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-semibold text-neutral-950">{business.name}</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  ⭐ {Number(business.avg_rating).toFixed(1)} · {business.review_count} reseñas
                </p>
                {business.description && (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-600">
                    {business.description}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
