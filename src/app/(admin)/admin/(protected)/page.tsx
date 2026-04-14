import { getServerClient } from '@/utils/supabase/server'

export const metadata = { title: 'Admin · Dashboard' }

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
}

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}

export default async function AdminOverviewPage() {
  const client = await getServerClient()

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [spacesEnabled, spacesDisabled, topicsWeek, postsWeek, staffCount] = await Promise.all([
    client.from('forum_spaces').select('id', { count: 'exact', head: true }).eq('enabled', true),
    client.from('forum_spaces').select('id', { count: 'exact', head: true }).eq('enabled', false),
    client.from('forum_topics').select('id', { count: 'exact', head: true }).gte('created_at', since),
    client.from('forum_posts').select('id', { count: 'exact', head: true }).gte('created_at', since),
    client.from('platform_admins').select('user_id', { count: 'exact', head: true }),
  ])

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Dashboard</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Resumen de la plataforma.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Espacios activos"
          value={spacesEnabled.count ?? 0}
          hint={`${spacesDisabled.count ?? 0} inactivos`}
        />
        <StatCard label="Temas (7 días)" value={topicsWeek.count ?? 0} />
        <StatCard label="Mensajes (7 días)" value={postsWeek.count ?? 0} />
        <StatCard label="Administradores" value={staffCount.count ?? 0} />
      </div>
    </div>
  )
}
