import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { formatMenuPrice, type MenuProduct } from '../api'
import { buildVisualImageDataUrl } from '../../../lib/visualImage'

export interface MenuItemCardProps {
  product: MenuProduct
  businessName: string
  onOpenProduct?: () => void
  onOrder?: () => void
}

export default function MenuItemCard({
  product,
  businessName,
  onOpenProduct,
  onOrder,
}: MenuItemCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative overflow-hidden">
        <img
          src={product.imageUrl || buildVisualImageDataUrl(product.name, businessName || 'Plato')}
          alt={product.name}
          className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-2">
            {product.isFeatured ? (
              <Badge variant="success" className="bg-white/95 text-[var(--brand-green-700)] shadow-sm">
                Destacado
              </Badge>
            ) : null}
          </div>

          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm backdrop-blur">
            {formatMenuPrice(product.price, product.currency || 'COP')}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="space-y-2">
          <h4 className="line-clamp-1 text-base font-semibold tracking-tight text-slate-950">
            {product.name}
          </h4>
          <p className="line-clamp-2 text-sm leading-6 text-slate-600">
            {product.shortDescription || product.description || 'Un plato disponible en la carta.'}
          </p>
        </div>

        <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
          {businessName}
        </p>

        <div className="mt-auto pt-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {onOpenProduct ? (
              <Button variant="outline" size="sm" onClick={onOpenProduct} fullWidth>
                Ver detalle
              </Button>
            ) : null}
            {onOrder ? (
              <Button size="sm" onClick={onOrder} fullWidth>
                Pedir ahora
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}
