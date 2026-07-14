import * as Sentry from '@sentry/nextjs'
import { getServerClient } from '@/utils/supabase/server'
import { AlertCircle, CalendarCheck, Inbox, Users } from 'lucide-react'

interface Props { schoolId: string }

const STATS_CONFIG = [
  {
    key: 'leads' as const,
    label: 'Leads totales',
    icon: Inbox,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    ring: 'ring-violet-100',
    valueCls: 'text-violet-700',
  },
  {
    key: 'trials' as const,
    label: 'Clases de prueba',
    icon: CalendarCheck,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    ring: 'ring-emerald-100',
    valueCls: 'text-emerald-700',
  },
  {
    key: 'follows' as const,
    label: 'Seguidores',
    icon: Users,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    ring: 'ring-blue-100',
    valueCls: 'text-blue-700',
  },
]

export async function DashboardStats({ schoolId }: Props) {
  const client = await getServerClient()
  const { data, error } = await client.rpc('get_escuelas_stats', { p_school_id: schoolId })

  if (error) {
    Sentry.captureException(error, { tags: { rpc: 'get_escuelas_stats', schoolId } })
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
        <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
        No se pudieron cargar las estadísticas. Intenta refrescar la página.
      </div>
    )
  }

  const s = (data ?? { leads: 0, trials: 0, follows: 0 }) as {
    leads: number
    trials: number
    follows: number
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {STATS_CONFIG.map(({ key, label, icon: Icon, iconBg, iconColor, ring, valueCls }) => (
        <div
          key={key}
          className="flex items-center gap-4 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm"
        >
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-4 ${iconBg} ${iconColor} ${ring}`}>
            <Icon size={20} aria-hidden="true" />
          </div>
          <div>
            <p className={`text-2xl font-bold tabular-nums ${valueCls}`}>
              {(s[key] ?? 0).toLocaleString('es')}
            </p>
            <p className="mt-0.5 text-sm text-neutral-500">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
