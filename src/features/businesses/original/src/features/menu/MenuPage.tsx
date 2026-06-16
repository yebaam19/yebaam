import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../../components/shared/Navbar'
import Footer from '../../components/shared/Footer'
import { FaUtensils, FaStar, FaWhatsapp, FaArrowLeft } from 'react-icons/fa6'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { getBusinessMenuById, type MenuCategory } from './api'
import MenuCatalog from './components/MenuCatalog'
import { getErrorMessage } from '../../lib/httpError'

type BusinessMenuResponse = {
  id: number
  name: string
  category: string
  description?: string | null
  city?: string | null
  address?: string | null
  whatsapp?: string | null
  phone?: string | null
  ratingAverage?: number
  reviewsCount?: number
  menus?: Array<{
    id: number
    name: string
    description?: string | null
    categories?: MenuCategory[]
  }>
}

function sanitizeWhatsApp(value: string) {
  return value.replace(/[^\d]/g, '')
}

function dedupeCategories(categories: MenuCategory[]) {
  const seen = new Map<number, MenuCategory>()

  for (const category of categories) {
    if (!seen.has(category.id)) {
      seen.set(category.id, category)
    }
  }

  return [...seen.values()]
}

export default function MenuPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [business, setBusiness] = useState<BusinessMenuResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null)

  useEffect(() => {
    async function loadMenu() {
      if (!id) {
        setError('No recibimos el identificador del negocio')
        setLoading(false)
        return
      }

      const businessId = Number(id)
      if (Number.isNaN(businessId)) {
        setError('El identificador del negocio no es válido')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        setBusiness(await getBusinessMenuById(businessId))
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'No pudimos cargar la carta'))
      } finally {
        setLoading(false)
      }
    }

    loadMenu()
  }, [id])

  const categories = useMemo(() => {
    const menus = business?.menus ?? []
    return dedupeCategories(menus.flatMap((menu) => menu.categories ?? []))
  }, [business])

  useEffect(() => {
    if (categories.length > 0 && activeCategoryId === null) {
      setActiveCategoryId(categories[0].id)
    }
  }, [activeCategoryId, categories])

  const whatsappUrl = useMemo(() => {
    const raw = business?.whatsapp || business?.phone
    if (!raw) return null

    const cleaned = sanitizeWhatsApp(raw)
    if (!cleaned) return null

    return `https://wa.me/${cleaned}?text=${encodeURIComponent(
      `Hola, quiero ver la carta de ${business?.name || 'este negocio'}.`
    )}`
  }, [business])

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#fbfaf7_0%,#f8fafc_100%)] text-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-green-700)]">
              Carta
            </p>
            <p className="mt-2 text-sm text-slate-500">Cargando carta...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error || !business) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#fbfaf7_0%,#f8fafc_100%)] text-slate-900">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            to={business ? `/businesses/${business.id}` : '/businesses'}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-green-700)] transition hover:text-[var(--brand-green-600)]"
          >
            <FaArrowLeft />
            Volver
          </Link>
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-green-700)]">
              Carta completa
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              No pudimos cargar la carta
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error || 'La carta no está disponible por ahora'}
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fbfaf7_0%,#f8fafc_100%)] text-slate-900">
      <Navbar
        brandName="Yebaam"
        brandHref="/"
        links={[
          { label: 'Negocio', href: `/businesses/${business.id}` },
          { label: 'Carta', href: '#carta' },
        ]}
        onLogin={() => navigate('/login')}
        onRegister={() => navigate('/register')}
      />

      <section className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Link
                to={`/businesses/${business.id}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-green-700)] transition hover:text-[var(--brand-green-600)]"
              >
                <FaArrowLeft />
                Volver al negocio
              </Link>
              <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-green-700)]">
                <FaUtensils /> Carta completa
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {business.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Recorre categorías, platos y precios con una lectura simple para elegir
                qué pedir sin perder contexto.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
                  <FaStar className="mr-1 text-amber-500" />
                  {business.ratingAverage?.toFixed(1) ?? '0.0'} ·{' '}
                  {business.reviewsCount ?? 0} reseñas
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
                  {categories.length} categoría{categories.length === 1 ? '' : 's'}
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
                  {categories.reduce((acc, cat) => acc + cat.products.length, 0)} platos
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
                  {business.city || 'Ubicación por confirmar'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Badge className="self-start">{business.category}</Badge>
              {whatsappUrl ? (
                <Button
                  onClick={() => window.open(whatsappUrl, '_blank', 'noreferrer')}
                  leftIcon={<FaWhatsapp />}
                >
                  Pedir por WhatsApp
                </Button>
              ) : null}
              <Button
                variant="outline"
                onClick={() => navigate(`/businesses/${business.id}`)}
              >
                Abrir perfil
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="carta" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-green-700)]">
                Explora por categoría
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Salta entre secciones y encuentra rápido el plato que estás buscando.
              </p>
            </div>

            <Badge variant="neutral">
              {categories.length} secciones disponibles
            </Badge>
          </div>
        </div>

        <MenuCatalog
          businessName={business.name}
          businessCategory={business.category}
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelectCategory={(categoryId) => {
            setActiveCategoryId(categoryId)
            document.getElementById(`menu-category-${categoryId}`)?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          }}
          onOpenProduct={(productId) => navigate(`/products/${productId}`)}
          onOrder={(productName) => {
            if (!whatsappUrl) return
            window.open(
              `${whatsappUrl}&text=${encodeURIComponent(
                `Hola, quiero pedir ${productName} en ${business.name}.`
              )}`,
              '_blank',
              'noreferrer'
            )
          }}
        />
      </section>

      <Footer />
    </main>
  )
}
