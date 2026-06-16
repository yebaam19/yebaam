import { Link } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { buildVisualImageDataUrl } from '../../../lib/visualImage'
import { trackEvent } from '../../../lib/analytics'

export interface ProductCardData {
  id: number | string
  name: string
  imageUrl?: string | null
  price: number | string
  description?: string
  category?: string
  isAvailable?: boolean
  isPopular?: boolean
  businessId?: number | string
  businessName?: string
}

interface ProductCardProps {
  product: ProductCardData
  onQuickAction?: (id: number | string) => void
}

function formatPrice(value: number | string) {
  const numericValue = typeof value === 'string' ? Number(value) : value

  if (Number.isNaN(numericValue)) {
    return String(value)
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numericValue)
}

export default function ProductCard({
  product,
  onQuickAction,
}: ProductCardProps) {
  return (
    <Card hoverable padding="none" className="overflow-hidden">
      <div className="relative">
        <img
          src={
            product.imageUrl ||
            buildVisualImageDataUrl(product.name, product.category || 'Producto')
          }
          alt={product.name}
          className="h-48 w-full object-cover"
        />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {product.category && <Badge>{product.category}</Badge>}
          {product.isPopular && <Badge variant="warning">Popular</Badge>}
          <Badge variant={product.isAvailable ? 'success' : 'neutral'}>
            {product.isAvailable ? 'Disponible' : 'No disponible por ahora'}
          </Badge>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {product.name}
            </h3>

            {product.businessName && (
              <p className="mt-1 text-sm text-slate-500">
                {product.businessName}
              </p>
            )}
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
            {formatPrice(product.price)}
          </span>
        </div>

        {product.description && (
          <p className="line-clamp-3 text-sm leading-6 text-slate-600">
            {product.description}
          </p>
        )}

        <div className="flex gap-3">
          <Link
            to={`/products/${product.id}`}
            onClick={() =>
              void trackEvent({
                eventType: 'PRODUCT_VIEW',
                entityType: 'product',
                entityId: product.id,
                sourceScreen: 'product_card',
                metadata: { action: 'open_detail' },
              })
            }
            className="flex-1"
          >
            <Button fullWidth>Ver detalle</Button>
          </Link>

          <Button
            variant="outline"
            onClick={() => {
              void trackEvent({
                eventType: 'PRODUCT_VIEW',
                entityType: 'product',
                entityId: product.id,
                sourceScreen: 'product_card',
                metadata: { action: 'quick_action' },
              })
              onQuickAction?.(product.id)
            }}
          >
            Abrir
          </Button>
        </div>
      </div>
    </Card>
  )
}
