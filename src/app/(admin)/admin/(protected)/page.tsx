import Link from 'next/link'
import type { Route } from 'next'
import { getServerClient } from '@/utils/supabase/server'
import {
  ChatBubbleLeftRightIcon,
  Squares2X2Icon,
  UsersIcon,
} from '@/components/icons/heroicons-shim'

export const metadata = { title: 'Admin · Dashboard' }

type StatTone = 'primary' | 'sky' | 'amber' | 'violet'

interface StatCardProps {
  href: Route
  label: string
  value: string | number
  hint?: string
  tone?: StatTone
  icon?: React.ComponentType<{ className?: string }>
}

const TONE_STYLES: Record<StatTone, { bar: string; chip: string; icon: string }> = {
  primary: {
    bar: 'bg-gradient-to-r from-primary-500 to-primary-600',
    chip: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    icon: 'text-primary-600 dark:text-primary-400',
  },
  sky: {
    bar: 'bg-gradient-to-r from-sky-400 to-sky-600',
    chip: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    icon: 'text-sky-600 dark:text-sky-400',
  },
  amber: {
    bar: 'bg-gradient-to-r from-amber-400 to-amber-600',
    chip: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  violet: {
    bar: 'bg-gradient-to-r from-violet-400 to-violet-600',
    chip: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    icon: 'text-violet-600 dark:text-violet-400',
  },
}

function StatCard({ href, label, value, hint, tone = 'primary', icon: Icon }: StatCardProps) {
  const styles = TONE_STYLES[tone]
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-primary-900/60"
    >
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${styles.bar}`} />
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-neutral-900 tabular-nums dark:text-neutral-100">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
        </div>
        {Icon && (
          <span className={`inline-flex rounded-lg p-2 ${styles.chip}`}>
            <Icon className={`h-5 w-5 ${styles.icon}`} />
          </span>
        )}
      </div>
    </Link>
  )
}

export default async function AdminOverviewPage() {
  const client = await getServerClient()

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [spacesEnabled, spacesDisabled, topicsWeek, postsWeek, adminsCount] = await Promise.all([
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
          href={'/admin/foros' as Route}
          tone="primary"
          icon={Squares2X2Icon}
          label="Espacios activos"
          value={spacesEnabled.count ?? 0}
          hint={`${spacesDisabled.count ?? 0} inactivos`}
        />
        <StatCard
          href={'/admin/foros/temas' as Route}
          tone="sky"
          icon={ChatBubbleLeftRightIcon}
          label="Temas (7 días)"
          value={topicsWeek.count ?? 0}
        />
        <StatCard
          href={'/admin/foros/temas' as Route}
          tone="amber"
          icon={ChatBubbleLeftRightIcon}
          label="Mensajes (7 días)"
          value={postsWeek.count ?? 0}
        />
        <StatCard
          href={'/admin/ajustes' as Route}
          tone="violet"
          icon={UsersIcon}
          label="Administradores"
          value={adminsCount.count ?? 0}
        />
      </div>
    </div>
  )
}
