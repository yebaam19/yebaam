import { cache } from 'react'
import { getServerClient } from '@/utils/supabase/server'

interface Props {
  businessId: string
}

interface Stat {
  label: string
  value: number
  hint: string
  highlight?: boolean
}

export interface BusinessStats {
  reviews: number
  follows: number
  likes: number
  posts: number
  reactions: number
  comments: number
  lastPostAt: string | null
}

export const fetchBusinessStats = cache(async (businessId: string): Promise<BusinessStats> => {
  const client = await getServerClient()
  const [statsRes, lastPostRes] = await Promise.all([
    client.rpc('get_comidas_stats', { p_business_id: businessId }),
    client
      .from('posts')
      .select('created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  const d = (statsRes.data ?? {}) as Partial<BusinessStats>
  return {
    reviews:    d.reviews   ?? 0,
    follows:    d.follows   ?? 0,
    likes:      d.likes     ?? 0,
    posts:      d.posts     ?? 0,
    reactions:  d.reactions ?? 0,
    comments:   d.comments  ?? 0,
    lastPostAt: lastPostRes.data?.created_at ?? null,
  }
})

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 60) return diffMin <= 1 ? 'Hace un momento' : `Hace ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return diffH === 1 ? 'Hace 1 hora' : `Hace ${diffH} horas`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'Ayer'
  if (diffD < 30) return `Hace ${diffD} días`
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

export async function DashboardStats({ businessId }: Props) {
  const s = await fetchBusinessStats(businessId)

  const stats: Stat[] = [
    { label: 'Seguidores',    value: s.follows,   hint: 'Ven tus novedades en el feed', highlight: true },
    { label: 'Publicaciones', value: s.posts,     hint: 'Posts en la red social' },
    { label: 'Reacciones',    value: s.reactions, hint: 'En tus publicaciones' },
    { label: 'Comentarios',   value: s.comments,  hint: 'En tus publicaciones' },
    { label: 'Reseñas',       value: s.reviews,   hint: 'Opiniones visibles' },
    { label: 'Me gusta',      value: s.likes,     hint: 'Guardado como favorito' },
  ]

  const lastPost = s.lastPostAt ? relativeTime(s.lastPostAt) : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, hint, highlight }) => (
          <div
            key={label}
            className={[
              'rounded-2xl border p-5 shadow-sm',
              highlight
                ? 'border-primary-200 bg-primary-50'
                : 'border-neutral-200 bg-white',
            ].join(' ')}
          >
            <p className={['text-sm font-medium', highlight ? 'text-primary-700' : 'text-neutral-500'].join(' ')}>
              {label}
            </p>
            <p className={['mt-2 text-3xl font-black tracking-tight', highlight ? 'text-primary-900' : 'text-neutral-950'].join(' ')}>
              {value.toLocaleString('es-CO')}
            </p>
            <p className="mt-1 text-xs text-neutral-400">{hint}</p>
          </div>
        ))}
      </div>

      <div className={[
        'rounded-2xl border px-5 py-4 flex items-center gap-3',
        lastPost ? 'border-neutral-200 bg-white' : 'border-dashed border-neutral-200 bg-neutral-50',
      ].join(' ')}>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neutral-500">Última publicación</p>
          <p className={['mt-0.5 text-sm font-semibold', lastPost ? 'text-neutral-900' : 'text-neutral-400'].join(' ')}>
            {lastPost ?? 'Aún no has publicado'}
          </p>
        </div>
        {!lastPost && (
          <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            Pendiente
          </span>
        )}
        {lastPost && s.follows > 0 && (
          <span className="shrink-0 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
            {s.follows} seguidor{s.follows !== 1 ? 'es' : ''} lo vieron
          </span>
        )}
      </div>
    </div>
  )
}
