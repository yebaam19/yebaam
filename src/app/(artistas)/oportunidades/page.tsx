import type { Metadata } from 'next'
import { listOpportunities } from '@/features/artistas/server/opportunity.server'
import { OpportunityCard } from '@/features/artistas/components/public/OpportunityCard'

export const metadata: Metadata = {
  title: 'Oportunidades | Yebaam Artistas',
  description: 'Encuentra castings, audiciones, colaboraciones y más.',
}

export default async function OportunidadesPage() {
  const opportunities = await listOpportunities()

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Oportunidades</h1>
      {opportunities.length === 0 ? (
        <p className="text-muted-foreground">No hay oportunidades abiertas.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunities.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} />
          ))}
        </div>
      )}
    </main>
  )
}
