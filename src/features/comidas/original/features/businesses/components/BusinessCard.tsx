import { Link } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { trackEvent } from '../../../lib/analytics'

export interface BusinessCardData {
  id: number | string
  name: string
  category: string
  coverImage: string
  description: string
  rating: number
  reviewsCount: number
  deliveryTime?: string
  priceLevel?: '$' | '$$' | '$$$'
  promoLabel?: string
  isOpen?: boolean
  location?: string
}

interface BusinessCardProps {
  business: BusinessCardData
  onExplore?: (id: number | string) => void
}

export default function BusinessCard({
  business,
  onExplore,
}: BusinessCardProps) {
  return (
    <Card hoverable padding="none" className="overflow-hidden">
      <div className="relative">
        <img
          src={business.coverImage}
          alt={business.name}
          className="h-56 w-full object-cover"
        />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <Badge>{business.category}</Badge>
          {business.promoLabel && (
            <Badge variant="success">{business.promoLabel}</Badge>
          )}
          <Badge variant={business.isOpen ? 'success' : 'neutral'}>
            {business.isOpen ? 'Abierto' : 'Cerrado'}
          </Badge>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {business.name}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                ⭐ {business.rating.toFixed(1)} · {business.reviewsCount} reseñas
              </p>
            </div>

            {business.priceLevel && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {business.priceLevel}
              </span>
            )}
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {business.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-slate-500">
          {business.deliveryTime && (
            <span className="rounded-full bg-slate-50 px-3 py-1">
              ⏱ {business.deliveryTime}
            </span>
          )}
          {business.location && (
            <span className="rounded-full bg-slate-50 px-3 py-1">
              📍 {business.location}
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <Link
            to={`/businesses/${business.id}`}
            onClick={() =>
              void trackEvent({
                eventType: 'BUSINESS_PROFILE_VIEW',
                entityType: 'business',
                entityId: business.id,
                sourceScreen: 'business_card',
                metadata: { action: 'open_detail' },
              })
            }
            className="flex-1"
          >
            <Button fullWidth>Abrir perfil</Button>
          </Link>

          <Button
            variant="outline"
            onClick={() => {
              void trackEvent({
                eventType: 'BUSINESS_PROFILE_VIEW',
                entityType: 'business',
                entityId: business.id,
                sourceScreen: 'business_card',
                metadata: { action: 'explore' },
              })
              onExplore?.(business.id)
            }}
          >
            Explorar carta
          </Button>
        </div>
      </div>
    </Card>
  )
}
