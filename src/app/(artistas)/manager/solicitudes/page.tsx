import { requireSession } from '@/lib/auth'
import { getManagedArtists } from '@/features/artistas/server/artist.server'
import { getIncomingRequests } from '@/features/artistas/server/request.server'
import { RequestsPanel } from '@/features/artistas/components/admin/RequestsPanel'

export default async function ManagerSolicitudesPage() {
  const { userId } = await requireSession()
  const managedArtists = await getManagedArtists(userId)

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Solicitudes — Manager</h1>
      {managedArtists.length === 0 ? (
        <p className="text-muted-foreground">No gestionas artistas aún.</p>
      ) : (
        <div className="space-y-8">
          {managedArtists.map((profile) => (
            <section key={profile.id}>
              <h2 className="text-lg font-semibold mb-3">{profile.stage_name}</h2>
              <RequestsPanel profileId={profile.id} requests={{}} />
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
