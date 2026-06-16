import type { Metadata } from 'next'
import { listArtistEvents } from '@/features/artistas/server/event.server'
import { EventCard } from '@/features/artistas/components/public/EventCard'

export const metadata: Metadata = {
  title: 'Eventos | Yebaam Artistas',
  description: 'Conciertos, showcases y eventos artísticos.',
}

export default async function EventosPage() {
  const events = await listArtistEvents()

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Eventos</h1>
      {events.length === 0 ? (
        <p className="text-muted-foreground">No hay eventos próximos.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </main>
  )
}
