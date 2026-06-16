import type { Metadata } from 'next'
import { listArtistCampaigns } from '@/features/artistas/server/campaign.server'
import { CampaignCard } from '@/features/artistas/components/public/CampaignCard'

export const metadata: Metadata = {
  title: 'Campañas | Yebaam Artistas',
  description: 'Convocatorias, lanzamientos y campañas artísticas.',
}

export default async function CampanasPage() {
  const campaigns = await listArtistCampaigns()

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Campañas</h1>
      {campaigns.length === 0 ? (
        <p className="text-muted-foreground">No hay campañas activas.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </main>
  )
}
