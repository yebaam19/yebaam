import { cfImageUrl } from '@/lib/cloudflare'
import type { Product } from '../../../types'

interface Props {
  product: Product
  businessName?: string
  onOpenProduct?: () => void
  /** Legacy prop — kept for caller compatibility, currently unused.
   *  Ordering flows through the business WhatsApp contact, not per-item. */
  onOrder?: () => void
}

function formatPrice(price: number, currency = 'COP') {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}

/** Horizontal layout: description + price left, image right.
 *  Mirrors DoorDash / Uber Eats menu item pattern — shows more items
 *  per scroll height without sacrificing visual identity. */
export function MenuItemCard({ product, businessName, onOpenProduct }: Props) {
  const imgUrl = cfImageUrl(product.cf_image_id)
  const price = formatPrice(Number(product.price), product.currency ?? 'COP')

  return (
    <article
      onClick={onOpenProduct}
      role={onOpenProduct ? 'button' : undefined}
      tabIndex={onOpenProduct ? 0 : undefined}
      onKeyDown={onOpenProduct ? (e) => e.key === 'Enter' && onOpenProduct() : undefined}
      aria-label={`${product.name} — ${price}`}
      className={[
        'group flex gap-4 rounded-2xl bg-white p-4',
        'ring-1 ring-neutral-950/5 shadow-[0_1px_6px_rgba(0,0,0,0.06)]',
        'transition-all duration-150',
        onOpenProduct
          ? 'cursor-pointer hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)] hover:-translate-y-0.5'
          : '',
      ].join(' ')}
    >
      {/* Left: text content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5">
          {product.is_featured && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              ✦ Destacado
            </span>
          )}
          {!product.is_active && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
              No disponible
            </span>
          )}
        </div>

        {/* Name */}
        <h4 className="line-clamp-1 text-base font-semibold text-neutral-950 group-hover:text-primary-700 transition-colors">
          {product.name}
        </h4>

        {/* Description */}
        {(product.short_description ?? product.description) && (
          <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500">
            {product.short_description ?? product.description}
          </p>
        )}

        {/* Footer: price + optional category context */}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <span className="text-base font-bold text-neutral-950">
            {price}
          </span>
          {businessName && (
            <span className="text-xs text-neutral-400">· {businessName}</span>
          )}
        </div>
      </div>

      {/* Right: image or placeholder */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-28 sm:w-28">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary-50 to-neutral-100">
            <span className="text-2xl opacity-50" aria-hidden="true">🍽️</span>
          </div>
        )}
      </div>
    </article>
  )
}
