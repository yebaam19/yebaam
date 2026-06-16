import { Link } from 'react-router-dom'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { buildVisualImageDataUrl } from '../../../lib/visualImage'

export interface ProductDetailHeroProps {
  name: string
  imageUrl?: string
  fallbackImageUrl?: string
  price: number | string
  category?: string
  shortDescription?: string
  isAvailable?: boolean
  isPopular?: boolean
  businessName?: string
  businessId?: number | string
  primaryActionLabel?: string
  secondaryActionLabel?: string
  primaryDisabled?: boolean
  onPrimaryAction?: () => void
  onSecondaryAction?: () => void
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

export default function ProductDetailHero({
  name,
  imageUrl,
  fallbackImageUrl,
  price,
  category,
  shortDescription,
  isAvailable = true,
  isPopular = false,
  businessName,
  businessId,
  primaryActionLabel = 'Pedir por WhatsApp',
  secondaryActionLabel = 'Ver negocio',
  primaryDisabled = false,
  onPrimaryAction,
  onSecondaryAction,
}: ProductDetailHeroProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative">
          <img
            src={imageUrl || fallbackImageUrl || buildVisualImageDataUrl(name, category || 'Producto')}
            alt={name}
            className="h-72 w-full object-cover md:h-96"
          />

          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
            {category && <Badge>{category}</Badge>}
            {isPopular && <Badge variant="warning">Popular</Badge>}
            <Badge variant={isAvailable ? 'success' : 'neutral'}>
              {isAvailable ? 'Disponible' : 'No disponible'}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col justify-between p-6 md:p-8">
          <div>
            {businessName && (
              <p className="mb-2 text-sm font-medium text-slate-500">
                De{' '}
                {businessId ? (
                  <Link
                    to={`/businesses/${businessId}`}
                    className="font-semibold text-orange-600 hover:text-orange-700"
                  >
                    {businessName}
                  </Link>
                ) : (
                  businessName
                )}
              </p>
            )}

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {name}
            </h1>

            <p className="mt-4 text-3xl font-bold text-orange-600">
              {formatPrice(price)}
            </p>

            {shortDescription && (
              <p className="mt-5 text-base leading-7 text-slate-600">
                {shortDescription}
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              fullWidth
              onClick={onPrimaryAction}
              disabled={!isAvailable || primaryDisabled}
            >
              {isAvailable ? primaryActionLabel : 'No disponible por ahora'}
            </Button>

            <Button
              size="lg"
              variant="outline"
              fullWidth
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
