import type { Metadata } from 'next'
import { listActivePromotions } from '@/features/comidas/server/promotion.server'
import { PromotionCard } from '@/features/comidas/components/public/PromotionCard'

export const metadata: Metadata = {
  title: 'Promociones | Yebaam Comidas',
  description: 'Encuentra las mejores promociones de negocios de comida.',
}

export default async function PromocionesPage() {
  const promotions = await listActivePromotions()

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Promociones</h1>
      {promotions.length === 0 ? (
        <p className="text-muted-foreground">No hay promociones activas.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map((p) => (
            <PromotionCard key={p.id} promotion={p} />
          ))}
        </div>
      )}
    </main>
  )
}
