import Link from 'next/link'
import Image from 'next/image'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

// Tarjetas de grid: la variante `thumbnail` (~20KB) rinde igual que `/public` (~87KB).
function cfImageUrl(id: string | null) {
  if (!id || !CF_HASH) return null
  return `https://imagedelivery.net/${CF_HASH}/${id}/thumbnail`
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

export interface ProductCardData {
  id: string
  slug?: string
  name: string
  cf_image_id?: string | null
  price: number
  description?: string | null
  category?: string | null
  is_active?: boolean
  is_featured?: boolean
  business_id?: string
  business_name?: string
}

interface ProductCardProps {
  product: ProductCardData
  onQuickAction?: (id: string) => void
}

export function ProductCard({ product, onQuickAction }: ProductCardProps) {
  const imageUrl = cfImageUrl(product.cf_image_id ?? null)

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-48 overflow-hidden bg-neutral-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 to-neutral-100">
            <span className="text-3xl">🍽️</span>
          </div>
        )}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {product.category && (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-neutral-700 backdrop-blur-sm">
              {product.category}
            </span>
          )}
          {product.is_featured && (
            <span className="rounded-full bg-secondary-500/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              Popular
            </span>
          )}
          <span className={[
            'rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm',
            product.is_active !== false
              ? 'bg-emerald-500/90 text-white'
              : 'bg-neutral-200/90 text-neutral-700',
          ].join(' ')}>
            {product.is_active !== false ? 'Disponible' : 'No disponible'}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">{product.name}</h3>
            {product.business_name && (
              <p className="mt-1 text-sm text-neutral-500">{product.business_name}</p>
            )}
          </div>
          <span className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-sm font-semibold text-neutral-700">
            {formatPrice(product.price)}
          </span>
        </div>

        {product.description && (
          <p className="line-clamp-3 text-sm leading-6 text-neutral-600">{product.description}</p>
        )}

        <div className="flex gap-3">
          <Link
            href={`/productos/${product.slug ?? product.id}` as never}
            className="flex-1 inline-flex items-center justify-center rounded-2xl bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800"
          >
            Ver detalle
          </Link>
          {onQuickAction && (
            <button
              type="button"
              onClick={() => onQuickAction(product.id)}
              className="rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              Abrir
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
