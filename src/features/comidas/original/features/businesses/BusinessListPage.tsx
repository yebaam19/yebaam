import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FaBullhorn,
  FaFireFlameCurved,
  FaLocationDot,
  FaMagnifyingGlass,
  FaStar,
  FaUtensils,
  FaWhatsapp,
} from 'react-icons/fa6'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { listBusinesses, type BusinessListItem } from './api'
import { buildVisualImageDataUrl } from '../../lib/visualImage'
import { trackEvent } from '../../lib/analytics'
import { getErrorMessage } from '../../lib/httpError'

export default function BusinessListPage() {
  const [businesses, setBusinesses] = useState<BusinessListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [focus, setFocus] = useState<'all' | 'top' | 'promos'>('all')

  useEffect(() => {
    async function loadBusinesses() {
      try {
        setLoading(true)
        setError('')
        setBusinesses(await listBusinesses())
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'No pudimos cargar los negocios'))
      } finally {
        setLoading(false)
      }
    }

    loadBusinesses()
  }, [])

  const filteredBusinesses = useMemo(() => {
    const term = search.trim().toLowerCase()
    const ranked = [...businesses].sort((a, b) => {
      const ratingDelta = (b.ratingAverage ?? 0) - (a.ratingAverage ?? 0)
      if (ratingDelta !== 0) return ratingDelta

      const promoDelta = (b.activePromotionsCount ?? 0) - (a.activePromotionsCount ?? 0)
      if (promoDelta !== 0) return promoDelta

      return (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0)
    })

    const byFocus = ranked.filter((business) => {
      if (focus === 'top') return (business.ratingAverage ?? 0) >= 4.5
      if (focus === 'promos') return (business.activePromotionsCount ?? 0) > 0
      return true
    })

    if (!term) return byFocus

    return byFocus.filter((business) => {
      const searchableText = [
        business.name,
        business.category,
        business.description,
        business.city,
        business.address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(term)
    })
  }, [businesses, focus, search])

  const metrics = useMemo(
    () => [
      { label: 'Negocios', value: businesses.length, icon: <FaUtensils /> },
      {
        label: 'Ofertas',
        value: businesses.reduce((acc, item) => acc + (item.activePromotionsCount ?? 0), 0),
        icon: <FaBullhorn />,
      },
      {
        label: 'Top',
        value: businesses.filter((item) => (item.ratingAverage ?? 0) >= 4.5).length,
        icon: <FaStar />,
      },
    ],
    [businesses]
  )

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(22,164,76,0.06),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="order-2 relative p-6 sm:p-8 lg:order-1 lg:p-10">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(22,164,76,0.06),transparent_35%,rgba(236,132,55,0.06))]" />
              <div className="relative max-w-2xl">
                <Link
                  to="/"
                  className="inline-flex text-sm font-medium text-[var(--brand-green-700)] transition hover:text-[var(--brand-green-600)]"
                >
                  ← Volver al inicio
                </Link>

                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--brand-green-50)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-green-700)]">
                  <FaFireFlameCurved className="text-[0.72rem]" />
                  Negocios locales para tu próximo antojo
                </div>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  Elige dónde comer con señales claras desde el primer vistazo.
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Busca por nombre, categoría o ciudad. Revisa reputación, ofertas y canales
                  de contacto antes de abrir la carta.
                </p>

                <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-3">
                  {metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-green-50)] text-[var(--brand-green-700)]">
                        {metric.icon}
                      </span>
                      <div>
                        <p className="text-lg font-semibold text-slate-950">{metric.value}</p>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                          {metric.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="order-1 border-b border-slate-200 bg-slate-50 p-4 sm:p-6 lg:order-2 lg:border-l lg:border-b-0 lg:border-t-0 lg:p-10">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <label htmlFor="business-search" className="mb-2 block text-sm font-medium text-slate-700">
                  ¿Qué se te antoja?
                </label>
                <div className="relative">
                  <FaMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="business-search"
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Hamburguesas, bandeja paisa, helados..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--brand-green-400)] focus:ring-4 focus:ring-[color:rgba(22,164,76,0.12)]"
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Button
                    variant={focus === 'all' ? 'secondary' : 'outline'}
                    size="sm"
                    fullWidth
                    onClick={() => setFocus('all')}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={focus === 'top' ? 'secondary' : 'outline'}
                    size="sm"
                    fullWidth
                    onClick={() => setFocus('top')}
                  >
                    Top
                  </Button>
                  <Button
                    variant={focus === 'promos' ? 'secondary' : 'outline'}
                    size="sm"
                    fullWidth
                    onClick={() => setFocus('promos')}
                  >
                    Ofertas
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200"
                    >
                    Borrar búsqueda
                    </button>
                  ) : null}
                  <Link
                    to="/promotions"
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-green-50)] px-3 py-1.5 text-xs font-medium text-[var(--brand-green-700)] transition hover:bg-[var(--brand-green-100)]"
                  >
                    <FaBullhorn className="text-[0.7rem]" />
                    Ver ofertas
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : filteredBusinesses.length === 0 ? (
          <EmptyState search={search} onReset={() => { setSearch(''); setFocus('all') }} />
        ) : (
          <>
            <div className="mb-5 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {filteredBusinesses.length}{' '}
                  {filteredBusinesses.length === 1 ? 'negocio encontrado' : 'negocios encontrados'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Ordenados por reputación, ofertas activas y señales útiles para decidir.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="neutral">Reputación</Badge>
                <Badge variant="neutral">Promociones</Badge>
                <Badge variant="neutral">Contacto directo</Badge>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredBusinesses.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

function BusinessCard({ business }: { business: BusinessListItem }) {
  const imageUrl =
    business.cover?.url ||
    buildVisualImageDataUrl(business.name, business.category || 'Negocio')
  const hasPromotion = (business.activePromotionsCount ?? 0) > 0
  const rating = business.ratingAverage ?? 0
  const reviews = business.reviewsCount ?? 0

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        <img src={imageUrl} alt={business.name} className="h-56 w-full object-cover" />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
            {business.category || 'Categoría por definir'}
          </span>

          {hasPromotion ? (
            <span className="rounded-full bg-[var(--brand-orange-500)] px-3 py-1 text-xs font-semibold text-white">
              <FaBullhorn className="mr-1 inline-block" />
              {business.activePromotionsCount} promo
              {(business.activePromotionsCount ?? 0) > 1 ? 's' : ''}
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-white">{business.name}</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-white/80">
                <FaLocationDot className="text-[0.8rem]" />
                <span className="truncate">{business.city || 'Ciudad no definida'}</span>
              </p>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
              <FaStar className="text-orange-500" />
              {rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <p className="line-clamp-2 text-sm leading-6 text-slate-600">
          {business.description || 'Este negocio todavía está preparando su presentación.'}
        </p>

        <div className="flex flex-wrap gap-2">
          <Badge variant="neutral">{reviews} {reviews === 1 ? 'reseña' : 'reseñas'}</Badge>
          <Badge variant="neutral">
            {business.address ? 'Dirección disponible' : 'Dirección pendiente'}
          </Badge>
          <Badge variant="neutral">
            {business.whatsapp || business.phone ? 'Contacto disponible' : 'Contacto pendiente'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            to={`/businesses/${business.id}`}
            onClick={() =>
              void trackEvent({
                eventType: 'BUSINESS_PROFILE_VIEW',
                entityType: 'business',
                entityId: business.id,
                sourceScreen: 'business_list',
                metadata: { action: 'card_click' },
              })
            }
            className="inline-flex items-center justify-center rounded-2xl bg-[var(--brand-green-600)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-green-700)]"
          >
            Abrir perfil
          </Link>

          {business.whatsapp ? (
            <a
              href={`https://wa.me/${sanitizeWhatsApp(business.whatsapp)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl border border-[color:rgba(22,164,76,0.24)] bg-white px-4 py-3 text-sm font-semibold text-[var(--brand-green-700)] transition hover:bg-[var(--brand-green-50)]"
            >
              <FaWhatsapp className="mr-2" />
              WhatsApp
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400"
            >
              Sin WhatsApp
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function LoadingState() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
        >
          <div className="h-56 animate-pulse bg-slate-200" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="h-11 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-11 animate-pulse rounded-2xl bg-slate-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-8 text-center">
      <h2 className="text-lg font-semibold text-red-700">
        No pudimos cargar los negocios
      </h2>
      <p className="mt-2 text-sm text-red-600">{message}</p>
    </div>
  )
}

function EmptyState({
  search,
  onReset,
}: {
  search: string
  onReset: () => void
}) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center">
      <h2 className="text-lg font-semibold text-slate-900">
        {search ? 'No encontramos coincidencias' : 'Aún no hay negocios visibles'}
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        {search
          ? 'Intenta con otro plato, una categoría o el nombre de un negocio.'
          : 'Cuando haya vitrinas publicadas, aparecerán aquí para que puedas explorarlas.'}
      </p>
      {search ? (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={onReset}>
            Ver todos los negocios
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function sanitizeWhatsApp(value: string) {
  return value.replace(/[^\d]/g, '')
}
