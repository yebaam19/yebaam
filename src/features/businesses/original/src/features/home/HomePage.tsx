import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaArrowRight,
  FaBullhorn,
  FaHouse,
  FaMagnifyingGlass,
  FaStar,
  FaUtensils,
} from 'react-icons/fa6'
import Navbar from '../../components/shared/Navbar'
import Footer from '../../components/shared/Footer'
import SearchBar from '../../components/shared/SearchBar'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { loadHomeCatalog, type HomeBusinessItem, type HomeProductItem } from './api'
import { buildVisualImageDataUrl } from '../../lib/visualImage'
import { trackEvent } from '../../lib/analytics'
import { getErrorMessage } from '../../lib/httpError'

function formatPrice(value: number | string, currency = 'COP') {
  const numericValue = typeof value === 'string' ? Number(value) : value

  if (Number.isNaN(numericValue)) {
    return String(value)
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(numericValue)
}

function matchesSearch(term: string, values: Array<string | number | null | undefined>) {
  if (!term) return true

  return values
    .filter((value) => value !== null && value !== undefined)
    .join(' ')
    .toLowerCase()
    .includes(term)
}

function sortBusinesses(items: HomeBusinessItem[]) {
  return [...items].sort((a, b) => {
    const ratingDelta = b.ratingAverage - a.ratingAverage
    if (ratingDelta !== 0) return ratingDelta

    const promoDelta = b.activePromotionsCount - a.activePromotionsCount
    if (promoDelta !== 0) return promoDelta

    return b.reviewsCount - a.reviewsCount
  })
}

function sortProducts(items: HomeProductItem[]) {
  return [...items].sort((a, b) => {
    const featuredDelta = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured))
    if (featuredDelta !== 0) return featuredDelta

    const ratingDelta = b.businessRating - a.businessRating
    if (ratingDelta !== 0) return ratingDelta

    return a.name.localeCompare(b.name)
  })
}

export default function HomePage() {
  const navigate = useNavigate()
  const resultsRef = useRef<HTMLDivElement | null>(null)

  const [search, setSearch] = useState('')
  const [businesses, setBusinesses] = useState<HomeBusinessItem[]>([])
  const [products, setProducts] = useState<HomeProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true)
        setError('')

        const catalog = await loadHomeCatalog()
        setBusinesses(sortBusinesses(catalog.businesses))
        setProducts(sortProducts(catalog.products))
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'No pudimos cargar las recomendaciones de inicio'))
      } finally {
        setLoading(false)
      }
    }

    loadCatalog()
  }, [])

  const normalizedSearch = search.trim().toLowerCase()

  const featuredBusinesses = useMemo(() => businesses.slice(0, 4), [businesses])
  const featuredProducts = useMemo(() => products.slice(0, 6), [products])
  const spotlightBusiness = featuredBusinesses[0]
  const spotlightImage =
    spotlightBusiness?.coverUrl ||
    buildVisualImageDataUrl(
      spotlightBusiness?.name || 'Restaurante',
      spotlightBusiness?.category || 'Negocio'
    )

  const matchingBusinesses = useMemo(() => {
    if (!normalizedSearch) return []

    return businesses.filter((business) =>
      matchesSearch(normalizedSearch, [
        business.name,
        business.category,
        business.description,
        business.city,
        business.address,
      ])
    )
  }, [businesses, normalizedSearch])

  const matchingProducts = useMemo(() => {
    if (!normalizedSearch) return []

    return products.filter((product) =>
      matchesSearch(normalizedSearch, [
        product.name,
        product.shortDescription,
        product.description,
        product.categoryName,
        product.businessName,
        product.businessCategory,
      ])
    )
  }, [normalizedSearch, products])

  const stats = useMemo(
    () => [
      { label: 'negocios para explorar', value: businesses.length, icon: <FaHouse /> },
      { label: 'platos en vitrina', value: products.length, icon: <FaUtensils /> },
      {
        label: 'reseñas de la comunidad',
        value: businesses.reduce((acc, business) => acc + business.reviewsCount, 0),
        icon: <FaStar />,
      },
    ],
    [businesses, products]
  )

  const handleSearchSubmit = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar
        brandName="Yebaam"
        brandHref="/"
        links={[
          { label: 'Negocios', href: '#resultados' },
          { label: 'Platos', href: '#resultados' },
          { label: 'Ofertas', href: '/promotions' },
        ]}
        onLogin={() => navigate('/login')}
        onRegister={() => navigate('/register')}
      />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
              <span className="inline-flex items-center gap-2">
                <FaMagnifyingGlass className="text-[0.7rem]" />
                Antojos reales, negocios cerca
              </span>
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Encuentra qué pedir antes de que se enfríe el antojo
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Explora negocios locales, mira sus platos, compara ofertas y llega al contacto
              correcto sin perder tiempo entre pantallas.
            </p>

            <div className="mx-auto mt-8 max-w-2xl">
              <SearchBar
                value={search}
                onChange={setSearch}
                onSearch={handleSearchSubmit}
                placeholder="Busca helado, bandeja paisa, hamburguesa o negocio"
                buttonLabel="Buscar"
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {stats.map((stat) => (
                <Metric
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  icon={stat.icon}
                />
              ))}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                leftIcon={<FaHouse />}
                onClick={() => {
                  void trackEvent({
                    eventType: 'CTA_CLICK',
                    sourceScreen: 'home_hero',
                    metadata: { action: 'view_businesses' },
                  })
                  navigate('/businesses')
                }}
              >
                Explorar negocios
              </Button>
              <Button
                variant="outline"
                leftIcon={<FaBullhorn />}
                onClick={() => {
                  void trackEvent({
                    eventType: 'CTA_CLICK',
                    sourceScreen: 'home_hero',
                    metadata: { action: 'view_promotions' },
                  })
                  navigate('/promotions')
                }}
              >
                Ver ofertas
              </Button>
              <Button
                variant="outline"
                leftIcon={<FaArrowRight />}
                onClick={() => {
                  void trackEvent({
                    eventType: 'CTA_CLICK',
                    sourceScreen: 'home_hero',
                    metadata: { action: 'register' },
                  })
                  navigate('/register')
                }}
              >
                Crear mi cuenta
              </Button>
            </div>
          </div>
        </div>
      </section>

      {!normalizedSearch ? (
        <section
          id="resultados"
          className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8"
        >
          <ShowcaseSection
            title="Negocios para empezar con hambre"
            subtitle="Una selección de vitrinas activas, con reputación y platos listos para descubrir."
            actionLabel="Ver todos los negocios"
            actionIcon={<FaArrowRight />}
            onAction={() => navigate('/businesses')}
          >
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredBusinesses.slice(0, 3).map((business) => (
                <HighlightBusinessCard
                  key={business.id}
                  business={business}
                  onOpen={() => navigate(`/businesses/${business.id}`)}
                />
              ))}
            </div>
          </ShowcaseSection>

          <ShowcaseSection
            title="Platos que abren la carta"
            subtitle="Fotos, precio y contexto para elegir rápido sin perder el detalle."
            actionLabel="Ver carta completa"
            actionIcon={<FaUtensils />}
            onAction={() => navigate('/businesses')}
          >
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredProducts.slice(0, 3).map((product) => (
                <HighlightProductCard
                  key={product.id}
                  product={product}
                  onOpenProduct={() => navigate(`/products/${product.id}`)}
                  onOpenBusiness={() => navigate(`/businesses/${product.businessId}`)}
                />
              ))}
            </div>
          </ShowcaseSection>
        </section>
      ) : (
        <section ref={resultsRef} id="resultados" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
                    Tu búsqueda
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Encontramos opciones para "{search.trim()}"
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Priorizamos negocios y platos que te llevan rápido a una decisión clara.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Chip label="Negocios" value={matchingBusinesses.length} />
                  <Chip label="Platos" value={matchingProducts.length} />
                  <Button variant="outline" onClick={() => setSearch('')}>
                    Limpiar búsqueda
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {loading ? (
                <LoadingState />
              ) : error ? (
                <ErrorState message={error} />
              ) : matchingBusinesses.length === 0 &&
                matchingProducts.length === 0 ? (
                <EmptySearchState term={search} onReset={() => setSearch('')} />
              ) : (
                <div className="grid gap-8 lg:grid-cols-2">
                  <ResultGroup
                    title="Negocios"
                    count={matchingBusinesses.length}
                    emptyLabel="No encontramos negocios con ese término."
                  >
                    {matchingBusinesses.slice(0, 4).map((business) => (
                      <BusinessRow
                        key={business.id}
                        business={business}
                        onOpen={() => navigate(`/businesses/${business.id}`)}
                      />
                    ))}
                  </ResultGroup>

                  <ResultGroup
                    title="Platos"
                    count={matchingProducts.length}
                    emptyLabel="No encontramos platos con ese término."
                  >
                    {matchingProducts.slice(0, 6).map((product) => (
                      <ProductRow
                        key={product.id}
                        product={product}
                        onOpenProduct={() => navigate(`/products/${product.id}`)}
                        onOpenBusiness={() =>
                          navigate(`/businesses/${product.businessId}`)
                        }
                      />
                    ))}
                  </ResultGroup>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

    <section className="relative overflow-hidden border-t border-emerald-900/30 bg-[#0f5f2f]">
  {/* Background minimal */}
  <div className="absolute inset-0">
    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%,rgba(0,0,0,0.14))]" />
    <div className="absolute -right-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
  </div>

  <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-24">
    {/* Content */}
    <div className="max-w-2xl text-white">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-lime-300" />
        Yebaam para negocios locales
      </div>

      <h2 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.35rem] lg:leading-[1.04]">
        Convierte tu negocio en una vitrina que se encuentra fácil
      </h2>

      <p className="mt-6 max-w-xl text-lg leading-8 text-white/75 sm:text-xl">
        Muestra tu carta, tus fotos y tus promociones en un perfil pensado para que nuevos
        clientes entiendan qué ofreces y cómo pedirte.
      </p>

      {/* Minimal value points */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
          <p className="text-sm font-semibold text-white">Perfil listo</p>
          <p className="mt-1 text-sm leading-5 text-white/60">
            Datos, historia y contacto reunidos.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
          <p className="text-sm font-semibold text-white">Carta visual</p>
          <p className="mt-1 text-sm leading-5 text-white/60">
            Platos con fotos, precios y descripciones.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
          <p className="text-sm font-semibold text-white">Más alcance</p>
          <p className="mt-1 text-sm leading-5 text-white/60">
            Una ruta más corta entre buscar y pedir.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="
            h-12 rounded-full
            bg-white px-8
            text-base font-semibold !text-[#164a33]
            shadow-sm transition-all duration-300
            hover:-translate-y-0.5 hover:bg-white/90 hover:!text-[#164a33]
            active:translate-y-0 active:scale-[0.98]
          "
          onClick={() => navigate('/register')}
        >
          Registrar mi negocio
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="
            h-12 rounded-full
            border border-white/25
            bg-white/[0.06] px-8
            text-base font-semibold !text-white
            shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
            backdrop-blur-md
            transition-all duration-300
            hover:-translate-y-0.5
            hover:border-white/35
            hover:bg-white/[0.12]
            hover:!text-white
            active:translate-y-0 active:scale-[0.98]
          "
          onClick={() => navigate('/businesses')}
        >
          Ver vitrinas activas
        </Button>
      </div>

      <p className="mt-4 text-sm leading-6 text-white/55">
        Pensado para comidas rápidas, cafeterías, restaurantes y marcas gastronómicas locales.
      </p>
    </div>

    {/* Visual */}
    <div className="relative flex justify-center lg:justify-end">
      <div className="relative w-full max-w-[460px] rounded-[2rem] border border-white/10 bg-white/10 p-2 shadow-2xl shadow-black/20 backdrop-blur-md">
        <div className="overflow-hidden rounded-[1.5rem] bg-emerald-950">
          <img
            src={spotlightImage}
            alt={spotlightBusiness?.name || 'Negocio destacado en Yebaam'}
            className="h-[380px] w-full object-cover sm:h-[430px] lg:h-[500px]"
          />
        </div>

        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/15 bg-black/45 p-4 text-white backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">
                {spotlightBusiness?.name || 'Tu negocio aquí'}
              </p>
              <p className="mt-1 text-xs text-white/65">
                Carta, productos y ofertas en una vitrina clara.
              </p>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#164a33]">
              Nuevo
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      <Footer
        brandName="Yebaam"
        description="Negocios y platos locales presentados con claridad para que descubrir, comparar y pedir sea más simple."
        linkGroups={[
          {
            title: 'Explorar',
            links: [
              { label: 'Negocios', href: '#resultados' },
              { label: 'Platos', href: '#resultados' },
            ],
          },
          {
            title: 'Cuenta',
            links: [
              { label: 'Iniciar sesión', href: '/login' },
              { label: 'Crear cuenta', href: '/register' },
            ],
          },
          {
            title: 'Negocios',
            links: [{ label: 'Panel de negocio', href: '/admin' }],
          },
        ]}
      />
    </main>
  )
}

function Metric({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-green-50)] text-[var(--brand-green-700)]">
        {icon}
      </span>
      <span className="font-semibold text-slate-950">{value}</span>
      <span>{label}</span>
    </div>
  )
}

function ShowcaseSection({
  title,
  subtitle,
  actionLabel,
  actionIcon,
  onAction,
  children,
}: {
  title: string
  subtitle: string
  actionLabel: string
  actionIcon?: ReactNode
  onAction: () => void
  children: ReactNode
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
        </div>

        <Button variant="outline" leftIcon={actionIcon} onClick={onAction}>
          {actionLabel}
        </Button>
      </div>

      <div className="px-6 py-6 sm:px-8">{children}</div>
    </section>
  )
}

function HighlightBusinessCard({
  business,
  onOpen,
}: {
  business: HomeBusinessItem
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative">
        <img
          src={business.coverUrl || buildVisualImageDataUrl(business.name, business.category || 'Negocio')}
          alt={business.name}
          className="h-56 w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
        <div className="absolute left-4 top-4">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
            <span className="inline-flex items-center gap-1">
              <FaStar className="text-[0.65rem] text-orange-500" />
              Popular
            </span>
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-lg font-semibold text-white drop-shadow-sm">{business.name}</p>
          <p className="mt-1 text-sm text-slate-200 drop-shadow-sm">
            {business.category || 'Categoría por definir'} · ⭐ {business.ratingAverage.toFixed(1)}
          </p>
        </div>
      </div>
    </button>
  )
}

function HighlightProductCard({
  product,
  onOpenProduct,
  onOpenBusiness,
}: {
  product: HomeProductItem
  onOpenProduct: () => void
  onOpenBusiness: () => void
}) {
  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative">
        <img
          src={product.imageUrl || buildVisualImageDataUrl(product.name, product.businessCategory || 'Plato')}
          alt={product.name}
          className="h-56 w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-white drop-shadow-sm">
                {product.name}
              </p>
              <p className="mt-1 truncate text-sm text-slate-200 drop-shadow-sm">
                {product.businessName}
              </p>
            </div>
            <span className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-slate-800 backdrop-blur">
              {formatPrice(product.price, product.currency || 'COP')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-4">
        <Button variant="outline" fullWidth onClick={onOpenProduct}>
          Ver plato
        </Button>
        <Button fullWidth onClick={onOpenBusiness}>
          Abrir carta
        </Button>
      </div>
    </article>
  )
}

function Chip({ label, value }: { label: string; value: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
      <span className="font-medium text-slate-950">{value}</span>
      <span>{label}</span>
    </div>
  )
}

function ResultGroup({
  title,
  count,
  emptyLabel,
  children,
}: {
  title: string
  count: number
  emptyLabel: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {count} {count === 1 ? 'resultado' : 'resultados'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {count > 0 ? (
          children
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </section>
  )
}

function BusinessRow({
  business,
  onOpen,
}: {
  business: HomeBusinessItem
  onOpen: () => void
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-orange-200 hover:shadow-sm">
      <img
        src={business.coverUrl || buildVisualImageDataUrl(business.name, business.category || 'Negocio')}
        alt={business.name}
        className="h-16 w-16 rounded-xl object-cover"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{business.name}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {business.category || 'Categoría por definir'} · ⭐ {business.ratingAverage.toFixed(1)}
            </p>
          </div>
          {business.activePromotionsCount > 0 ? (
            <Badge variant="success">
              {business.activePromotionsCount} promo
              {business.activePromotionsCount === 1 ? '' : 's'}
            </Badge>
          ) : null}
        </div>

        <p className="mt-2 line-clamp-1 text-xs text-slate-500">
          {business.description || 'Este negocio todavía está preparando su presentación.'}
        </p>
      </div>

      <Button variant="outline" size="sm" onClick={onOpen}>
        Abrir
      </Button>
    </article>
  )
}

function ProductRow({
  product,
  onOpenProduct,
  onOpenBusiness,
}: {
  product: HomeProductItem
  onOpenProduct: () => void
  onOpenBusiness: () => void
}) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-orange-200 hover:shadow-sm">
      <img
        src={product.imageUrl || buildVisualImageDataUrl(product.name, product.businessCategory || 'Plato')}
        alt={product.name}
        className="h-16 w-16 rounded-xl object-cover"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">{product.name}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {product.businessName}
            </p>
          </div>
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
            {formatPrice(product.price, product.currency || 'COP')}
          </span>
        </div>

        <p className="mt-2 line-clamp-1 text-xs text-slate-500">
          {product.shortDescription || product.description || 'Este plato todavía no tiene descripción.'}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button variant="outline" size="sm" onClick={onOpenProduct}>
          Ver plato
        </Button>
        <Button size="sm" onClick={onOpenBusiness}>
          Ver carta
        </Button>
      </div>
    </article>
  )
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-56 animate-pulse rounded-2xl bg-slate-200" />
      <div className="grid gap-3 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, column) => (
          <div key={column} className="space-y-3">
            {Array.from({ length: 3 }).map((__, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm font-semibold text-red-700">No pudimos cargar la información</p>
      <p className="mt-2 text-sm text-red-600">{message}</p>
    </div>
  )
}

function EmptySearchState({
  term,
  onReset,
}: {
  term: string
  onReset: () => void
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="text-lg font-semibold text-slate-950">
        No encontramos opciones para "{term}"
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Intenta con otro plato, una categoría o el nombre de un negocio.
      </p>
      <div className="mt-6">
        <Button variant="outline" onClick={onReset}>
          Limpiar búsqueda
        </Button>
      </div>
    </div>
  )
}
