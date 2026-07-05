import type { Product } from '../../../types'

interface MenuItemCardProps {
  product: Product
  businessName: string
  onOpenProduct?: () => void
  onOrder?: () => void
}

function formatMenuPrice(price: number, currency = 'COP') {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}

export function MenuItemCard({ product, businessName, onOpenProduct, onOrder }: MenuItemCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative overflow-hidden bg-neutral-100">
        {product.cf_image_id ? (
          <img
            src={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH}/${product.cf_image_id}/thumbnail`}
            alt={product.name}
            className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br from-primary-50 to-neutral-100">
            <span className="text-3xl">🍽️</span>
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-2">
            {product.is_featured && (
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-primary-700 shadow-sm">
                Destacado
              </span>
            )}
          </div>
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-neutral-900 shadow-sm backdrop-blur">
            {formatMenuPrice(product.price, product.currency ?? 'COP')}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="space-y-2">
          <h4 className="line-clamp-1 text-base font-semibold tracking-tight text-neutral-950">{product.name}</h4>
          <p className="line-clamp-2 text-sm leading-6 text-neutral-600">
            {product.short_description ?? product.description ?? 'Un plato disponible en la carta.'}
          </p>
        </div>
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-neutral-400">{businessName}</p>
        <div className="mt-auto pt-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {onOpenProduct && (
              <button
                type="button"
                onClick={onOpenProduct}
                className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                Ver detalle
              </button>
            )}
            {onOrder && (
              <button
                type="button"
                onClick={onOrder}
                className="rounded-2xl bg-primary-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-800"
              >
                Pedir ahora
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
