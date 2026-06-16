import { getServerClient } from '@/utils/supabase/server'

interface Props {
  schoolId: string
}

export async function DashboardStats({ schoolId }: Props) {
  const client = await getServerClient()
  const { data } = await client.rpc('get_escuelas_stats', { p_school_id: schoolId })
  const s = (data ?? { leads: 0, trials: 0, follows: 0 }) as { leads: number; trials: number; follows: number }

  const stats = [
    { label: 'Leads',             value: s.leads },
    { label: 'Solicitudes clase', value: s.trials },
    { label: 'Seguidores',        value: s.follows },
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
