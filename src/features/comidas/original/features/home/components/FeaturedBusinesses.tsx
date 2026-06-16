import SectionHeader from '../../../components/shared/SectionHeader'
import Card, {
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import { buildVisualImageDataUrl } from '../../../lib/visualImage'
import { trackEvent } from '../../../lib/analytics'

export interface FeaturedBusinessItem {
  id: number | string
  name: string
  category: string
  rating: number
  reviewsCount: number
  imageUrl: string
  description: string
  promoLabel?: string
}

export interface FeaturedBusinessesProps {
  items: FeaturedBusinessItem[]
  onViewAll?: () => void
  onSelectBusiness?: (id: number | string) => void
}

export default function FeaturedBusinesses({
  items,
  onViewAll,
  onSelectBusiness,
}: FeaturedBusinessesProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Destacados"
        title="Negocios que se entienden desde el primer vistazo"
        description="Una selección de vitrinas con información clara, reputación visible y ruta directa a la carta."
        actionLabel="Ver negocios"
        onAction={onViewAll}
      />

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((business) => (
          <Card
            key={business.id}
            hoverable
            padding="none"
            className="overflow-hidden"
          >
            <div className="relative">
              <img
                src={business.imageUrl || buildVisualImageDataUrl(business.name, business.category)}
                alt={business.name}
                className="h-56 w-full object-cover"
              />
              <div className="absolute left-4 top-4 flex gap-2">
                <Badge>{business.category}</Badge>
                {business.promoLabel && <Badge variant="success">{business.promoLabel}</Badge>}
              </div>
            </div>

            <CardContent className="p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{business.name}</CardTitle>
                  <CardDescription className="mt-1">
                    ⭐ {business.rating.toFixed(1)} · {business.reviewsCount} reseñas
                  </CardDescription>
                </div>
              </div>

              <p className="text-sm leading-6 text-slate-600">
                {business.description}
              </p>
            </CardContent>

            <CardFooter className="border-t border-slate-100 px-5 py-4">
              <Button
                fullWidth
                onClick={() => {
                  void trackEvent({
                    eventType: 'BUSINESS_PROFILE_VIEW',
                    entityType: 'business',
                    entityId: business.id,
                    sourceScreen: 'home_featured_businesses',
                    metadata: { action: 'open_detail' },
                  })
                  onSelectBusiness?.(business.id)
                }}
              >
                Abrir perfil
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
