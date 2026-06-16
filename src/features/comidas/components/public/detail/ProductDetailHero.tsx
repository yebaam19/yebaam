import Image from 'next/image'
import Link from 'next/link'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

function cfImageUrl(id: string | null) {
  if (!id || !CF_HASH) return null
  return `https://imagedelivery.net/${CF_HASH}/${id}/public`
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

export interface ProductDetailHeroProps {
  name: string
  cfImageId?: string | null
  price: number
  category?: string | null
  shortDescription?: string | null
  isAvailable?: boolean
  isFeatured?: boolean
  businessName?: string
  businessSlug?: string
  primaryActionLabel?: string
  secondaryActionLabel?: string
  primaryDisabled?: boolean
  onPrimaryAction?: () => void
  onSecondaryAction?: () => void
}

export function ProductDetailHero({
  name,
  cfImageId,
  price,
  category,
  shortDescription,
  isAvailable = true,
  isFeatured = false,
  businessName,
  businessSlug,
  primaryActionLabel = 'Pedir por WhatsApp',
  secondaryActionLabel = 'Ver negocio',
  primaryDisabled = false,
  onPrimaryAction,
  onSecondaryAction,
}: ProductDetailHeroProps) {
  const imageUrl = cfImageUrl(cfImageId ?? null)

  return (
    <section className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative h-72 overflow-hidden bg-neutral-100 md:h-96">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 to-neutral-100">
              <span className="text-5xl">🍽️</span>
            </div>
          )}
          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
            {category && (
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-700 backdrop-blur-sm">
                {category}
              </span>
            )}
            {isFeatured && (
              <span className="rounded-full bg-secondary-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                Popular
              </span>
            )}
            <span className={[
              'rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm',
              isAvailable ? 'bg-emerald-500/90 text-white' : 'bg-neutral-200/90 text-neutral-700',
            ].join(' ')}>
              {isAvailable ? 'Disponible' : 'No disponible'}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between p-6 md:p-8">
          <div>
            {businessName && (
              <p className="mb-2 text-sm font-medium text-neutral-500">
                De{' '}
                {businessSlug ? (
                  <Link href={`/negocios/${businessSlug}` as never} className="font-semibold text-primary-700 hover:text-primary-800">
                    {businessName}
                  </Link>
                ) : (
                  businessName
                )}
              </p>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">{name}</h1>
            <p className="mt-4 text-3xl font-bold text-orange-600">{formatPrice(price)}</p>
            {shortDescription && (
              <p className="mt-5 text-base leading-7 text-neutral-600">{shortDescription}</p>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onPrimaryAction}
              disabled={!isAvailable || primaryDisabled}
              className="flex-1 rounded-2xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAvailable ? primaryActionLabel : 'No disponible por ahora'}
            </button>
            <button
              type="button"
              onClick={onSecondaryAction}
              className="flex-1 rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              {secondaryActionLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
