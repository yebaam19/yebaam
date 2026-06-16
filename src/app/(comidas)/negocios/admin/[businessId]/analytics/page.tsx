import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getBusinessById } from '@/features/comidas/server/business.server'
import { fetchBusinessAnalytics } from '@/features/comidas/server/stats.server'
import { PageHeader } from '@/features/comidas/components/admin/shared/PageHeader'

interface Props {
  params: Promise<{ businessId: string }>
}

function growthLabel(current: number, prev: number): { text: string; up: boolean; neutral: boolean } {
  if (prev === 0 && current === 0) return { text: 'Sin datos', up: false, neutral: true }
  if (prev === 0) return { text: `+${current} esta semana`, up: true, neutral: false }
  const pct = Math.round(((current - prev) / prev) * 100)
  if (pct === 0) return { text: 'Sin cambio', up: false, neutral: true }
  return {
    text: `${pct > 0 ? '+' : ''}${pct}% vs semana anterior`,
    up: pct > 0,
    neutral: false,
  }
}

function MetricCard({
  label, total, week, prevWeek, suffix,
}: {
  label: string
  total: number
  week: number
  prevWeek?: number
  suffix?: string
}) {
  const growth = prevWeek !== undefined ? growthLabel(week, prevWeek) : null
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-2 text-4xl font-black tracking-tight text-neutral-950">
        {total.toLocaleString('es-CO')}{suffix}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-neutral-400">
          {week > 0 ? `+${week} esta semana` : 'Sin actividad esta semana'}
        </span>
        {growth && !growth.neutral && (
          <span className={[
            'rounded-full px-2.5 py-0.5 text-xs font-semibold',
            growth.up ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600',
          ].join(' ')}>
            {growth.text}
          </span>
        )}
      </div>
    </div>
  )
}

function RatingCard({ total, avgRating, week }: { total: number; avgRating: number; week: number }) {
  const stars = Math.round(avgRating)
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-neutral-500">Reseñas</p>
      <div className="mt-2 flex items-end gap-3">
        <p className="text-4xl font-black tracking-tight text-neutral-950">
          {total.toLocaleString('es-CO')}
        </p>
        {avgRating > 0 && (
          <div className="mb-1 flex items-center gap-1.5">
            <div className="flex" aria-label={`${avgRating} de 5 estrellas`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  aria-hidden
                  className={i < stars ? 'text-amber-400' : 'text-neutral-200'}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm font-semibold text-neutral-700">{avgRating}</span>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-neutral-400">
        {week > 0 ? `+${week} esta semana` : 'Sin reseñas esta semana'}
      </p>
    </div>
  )
}

function GrowthBar({ label, week, prevWeek }: { label: string; week: number; prevWeek: number }) {
  const maxVal = Math.max(week, prevWeek, 1)
  const thisW = Math.round((week / maxVal) * 100)
  const lastW = Math.round((prevWeek / maxVal) * 100)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-neutral-700">{label}</span>
        <span className="text-neutral-400">
          Esta semana: <strong className="text-neutral-900">{week}</strong>
          {' · '}
          Ant.: <strong className="text-neutral-500">{prevWeek}</strong>
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex h-2 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="rounded-full bg-primary-500 transition-all"
            style={{ width: `${thisW}%` }}
          />
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="rounded-full bg-neutral-300 transition-all"
            style={{ width: `${lastW}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default async function AdminAnalyticsPage({ params }: Props) {
  await requireSession()
  const { businessId } = await params

  const [business, analytics] = await Promise.all([
    getBusinessById(businessId),
    fetchBusinessAnalytics(businessId),
  ])
  if (!business) notFound()

  const totalEngagement =
    analytics.follows.total + analytics.likes.total + analytics.customers.total

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader
        title="Analytics"
        subtitle={`Métricas de crecimiento y engagement de ${business.name}`}
      />

      {/* Hero — totales */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <div className="col-span-2 sm:col-span-2 rounded-2xl border border-primary-200 bg-primary-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-primary-700">Engagement total</p>
          <p className="mt-2 text-5xl font-black tracking-tight text-primary-900">
            {totalEngagement.toLocaleString('es-CO')}
          </p>
          <p className="mt-2 text-xs text-primary-600">
            Seguidores · Me gusta · Clientes registrados
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Publicaciones</p>
          <p className="mt-2 text-4xl font-black tracking-tight text-neutral-950">
            {analytics.posts.total.toLocaleString('es-CO')}
          </p>
          <p className="mt-2 text-xs text-neutral-400">
            {analytics.posts.week > 0 ? `+${analytics.posts.week} esta semana` : 'Sin posts esta semana'}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">Clientes</p>
          <p className="mt-2 text-4xl font-black tracking-tight text-neutral-950">
            {analytics.customers.total.toLocaleString('es-CO')}
          </p>
          <p className="mt-2 text-xs text-neutral-400">
            {analytics.customers.week > 0 ? `+${analytics.customers.week} esta semana` : 'Sin nuevos esta semana'}
          </p>
        </div>
      </div>

      {/* Métricas individuales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <MetricCard
          label="Seguidores"
          total={analytics.follows.total}
          week={analytics.follows.week}
          prevWeek={analytics.follows.prev_week}
        />
        <MetricCard
          label="Me gusta"
          total={analytics.likes.total}
          week={analytics.likes.week}
          prevWeek={analytics.likes.prev_week}
        />
        <RatingCard
          total={analytics.reviews.total}
          avgRating={analytics.reviews.avg_rating}
          week={analytics.reviews.week}
        />
      </div>

      {/* Comparativa semana vs semana anterior */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm mb-8">
        <h2 className="mb-1 text-base font-semibold text-neutral-900">
          Esta semana vs semana anterior
        </h2>
        <p className="mb-6 text-xs text-neutral-500">
          Barra azul = esta semana · Barra gris = semana anterior
        </p>
        <div className="space-y-5">
          <GrowthBar label="Seguidores nuevos"  week={analytics.follows.week}  prevWeek={analytics.follows.prev_week} />
          <GrowthBar label="Me gusta nuevos"     week={analytics.likes.week}    prevWeek={analytics.likes.prev_week} />
          <GrowthBar label="Publicaciones"       week={analytics.posts.week}    prevWeek={0} />
          <GrowthBar label="Reseñas nuevas"      week={analytics.reviews.week}  prevWeek={0} />
        </div>
      </section>

      {/* Crecimiento mensual de seguidores */}
      {analytics.follows.month > 0 && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-neutral-900">Resumen mensual</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Nuevos seguidores (30d)', value: analytics.follows.month },
              { label: 'Clientes nuevos (7d)',    value: analytics.customers.week },
              { label: 'Posts esta semana',       value: analytics.posts.week },
              { label: 'Reseñas esta semana',     value: analytics.reviews.week },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-neutral-50 p-4">
                <p className="text-xs text-neutral-500">{label}</p>
                <p className="mt-1.5 text-2xl font-black text-neutral-900">{value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {totalEngagement === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-16 text-center">
          <p className="text-4xl" aria-hidden>📊</p>
          <h2 className="mt-4 text-base font-semibold text-neutral-900">Sin datos aún</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Las métricas aparecen cuando los usuarios interactúan con tu negocio.
          </p>
        </div>
      )}
    </main>
  )
}
