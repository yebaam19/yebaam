import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import Card from '../../../components/ui/Card'
import { trackEvent } from '../../../lib/analytics'

export interface PromotionCardData {
  id: number | string
  title: string
  description: string
  imageUrl: string
  businessName: string
  discountLabel?: string
  expiresAtLabel?: string
  isHighlighted?: boolean
}

interface PromotionCardProps {
  promotion: PromotionCardData
  onClick?: (id: number | string) => void
}

export default function PromotionCard({
  promotion,
  onClick,
}: PromotionCardProps) {
  return (
    <Card hoverable padding="none" className="overflow-hidden">
      <div className="relative">
        <img
          src={promotion.imageUrl}
          alt={promotion.title}
          className="h-52 w-full object-cover"
        />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {promotion.discountLabel && (
            <Badge variant="warning">{promotion.discountLabel}</Badge>
          )}

          {promotion.isHighlighted && (
            <Badge variant="success">Destacada</Badge>
          )}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            {promotion.businessName}
          </p>

          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            {promotion.title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {promotion.description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-slate-500">
            {promotion.expiresAtLabel ? (
              <span>Vigente hasta: {promotion.expiresAtLabel}</span>
            ) : (
              <span>Vigencia sujeta al negocio</span>
            )}
          </div>

          <Button
            onClick={() => {
              void trackEvent({
                eventType: 'PROMOTION_CLICK',
                entityType: 'promotion',
                entityId: promotion.id,
                sourceScreen: 'promotion_card',
                metadata: { action: 'open_detail' },
              })
              onClick?.(promotion.id)
            }}
          >
            Ver oferta
          </Button>
        </div>
      </div>
    </Card>
  )
}
