import SectionHeader from '../../../components/shared/SectionHeader'
import PromotionCard, { type PromotionCardData } from './PromotionCard'

interface PromotionSectionProps {
  title?: string
  description?: string
  eyebrow?: string
  items: PromotionCardData[]
  onViewAll?: () => void
  onSelectPromotion?: (id: number | string) => void
  emptyTitle?: string
  emptyDescription?: string
}

export default function PromotionSection({
  title = 'Ofertas que hacen más fácil pedir',
  description = 'Promociones claras, visibles y conectadas con la carta del negocio.',
  eyebrow = 'Ofertas',
  items,
  onViewAll,
  onSelectPromotion,
  emptyTitle = 'No hay ofertas disponibles',
  emptyDescription = 'Cuando existan campañas activas o descuentos visibles, aparecerán aquí.',
}: PromotionSectionProps) {
  return (
    <section className="space-y-6">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actionLabel={items.length > 0 ? 'Ver ofertas' : undefined}
        onAction={items.length > 0 ? onViewAll : undefined}
      />

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h3 className="text-lg font-semibold text-slate-900">{emptyTitle}</h3>
          <p className="mt-2 text-sm text-slate-500">{emptyDescription}</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <PromotionCard
              key={item.id}
              promotion={item}
              onClick={onSelectPromotion}
            />
          ))}
        </div>
      )}
    </section>
  )
}
