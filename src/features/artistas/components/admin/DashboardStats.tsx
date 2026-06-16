import { getServerClient } from '@/utils/supabase/server'

interface Props {
  profileId: string
}

export async function DashboardStats({ profileId }: Props) {
  const client = await getServerClient()
  const { data } = await client.rpc('get_artistas_stats', { p_profile_id: profileId })
  const s = (data ?? { follows: 0, favorites: 0, portfolio: 0 }) as { follows: number; favorites: number; portfolio: number }

  const stats = [
    { label: 'Seguidores', value: s.follows },
    { label: 'Favoritos',  value: s.favorites },
    { label: 'Obras',      value: s.portfolio },
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map(({ label, value }) => (
        <div key={label} className="rounded-xl border border-border p-4 text-center">
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
        </div>
      ))}
    </div>
  )
}
