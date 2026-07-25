import Image from 'next/image'
import { cfImageUrl } from './BusinessHero'
import type { Promotion } from '../../../types'

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}

interface Props {
  promotions: Promotion[]
  businessName: string
}

export function BusinessPromosTab({ promotions, businessName }: Props) {
  const active = promotions.filter((p) => p.status === 'ACTIVE' || !p.status)

  if (active.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <h3 className="text-lg font-semibold text-neutral-900">No hay ofertas disponibles</h3>
        <p className="mt-2 text-sm text-neutral-500">
          Cuando existan promociones activas de {businessName}, aparecerán aquí.
        </p>
      </div>
    )
  }

  const [featured, ...rest] = active

  return (
    <div className="space-y-6">
      {/* Featured promo */}
      <div className="overflow-hidden rounded-[1.75rem] border border-secondary-200 bg-white shadow-sm">
        <div className="grid gap-0 md:grid-cols-[1fr_1.4fr]">
          <div className="relative min-h-48 bg-primary-50">
            {cfImageUrl(featured.cf_image_id) ? (
              <Image
                src={cfImageUrl(featured.cf_image_id)!} alt={featured.title} fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
                unoptimized
              />
            ) : (
              <div className="flex h-full min-h-48 items-center justify-center bg-gradient-to-br from-secondary-50 to-secondary-100 text-5xl">
                🎉
              </div>
            )}
            {featured.is_highlighted && (
              <span className="absolute left-4 top-4 rounded-full bg-secondary-700 px-3 py-1 text-xs font-bold text-white">
                Destacada
              </span>
            )}
          </div>
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-700">Oferta especial</p>
            <h3 className="mt-2 text-2xl font-semibold text-neutral-950">{featured.title}</h3>
            {featured.description && (
              <p className="mt-3 text-sm leading-7 text-neutral-600">{featured.description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-neutral-500">
              {featured.ends_at && (
                <span className="rounded-full bg-neutral-100 px-3 py-1">
                  Vigente hasta: {formatDate(featured.ends_at)}
                </span>
              )}
            </div>
            {featured.cta_url && featured.cta_label && (
              <a
                href={featured.cta_url} target="_blank" rel="noreferrer"
                className="mt-5 inline-flex items-center justify-center rounded-2xl bg-primary-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-800"
              >
                {featured.cta_label}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Rest of promos */}
      {rest.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rest.map((promo) => {
            const imgUrl = cfImageUrl(promo.cf_image_id)
            return (
              <article
                key={promo.id}
                className="overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative h-48 bg-primary-50">
                  {imgUrl ? (
                    <Image src={imgUrl} alt={promo.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">🎁</div>
                  )}
                  {promo.is_highlighted && (
                    <span className="absolute left-3 top-3 rounded-full bg-secondary-700 px-2.5 py-0.5 text-xs font-bold text-white">
                      Destacada
                    </span>
                  )}
                </div>
                <div className="space-y-3 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">{businessName}</p>
                  <h4 className="text-base font-semibold text-neutral-900">{promo.title}</h4>
                  {promo.description && (
                    <p className="line-clamp-2 text-sm leading-6 text-neutral-600">{promo.description}</p>
                  )}
                  {promo.ends_at && (
                    <p className="text-xs text-neutral-500">Vigente hasta: {formatDate(promo.ends_at)}</p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
