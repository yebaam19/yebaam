import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../../components/shared/Navbar'
import Footer from '../../components/shared/Footer'
import {
  FaArrowLeft,
  FaStar,
} from 'react-icons/fa6'
import SectionHeader from '../../components/shared/SectionHeader'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { formatMenuPrice, type MenuCategory, type MenuProduct } from '../menu/api'
import ReviewSection from '../reviews/ReviewSection'
import { getBusinessById, getBusinessCustomers, getBusinessFollowers } from './api'
import { buildVisualImageDataUrl } from '../../lib/visualImage'
import { trackCtaClick, trackEvent } from '../../lib/analytics'
import { getErrorMessage } from '../../lib/httpError'
import VerifiedBadge from './components/VerifiedBadge'
import BusinessLikeButton from './components/BusinessLikeButton'
import BusinessFollowButton from './components/BusinessFollowButton'
import BusinessCustomerButton from './components/BusinessCustomerButton'
import BusinessCommunitySection from './components/BusinessCommunitySection'
import type { BusinessCommunityUser } from './api'

type MediaAsset = {
  id: number
  url: string
  type?: 'IMAGE' | 'VIDEO'
  isPrimary?: boolean
  altText?: string | null
  title?: string | null
}

type Promotion = {
  id: number
  title: string
  description?: string | null
  imageUrl?: string | null
  ctaLabel?: string | null
  isHighlighted?: boolean
  status?: string
}

type BusinessDetail = {
  id: number
  name: string
  slug: string
  category: string
  businessType?: string | null
  description?: string | null
  city?: string | null
  address?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  website?: string | null
  instagram?: string | null
  facebook?: string | null
  tiktok?: string | null
  isActive: boolean
  isVerified?: boolean
  ratingAverage?: number
  reviewsCount?: number
  likesCount?: number
  hasLiked?: boolean
  isCustomer?: boolean
  isFollowing?: boolean
  followersCount?: number
  customersCount?: number
  profileImageUrl?: string | null
  mediaAssets?: MediaAsset[]
  promotions?: Promotion[]
  posts?: Array<{
    id: number
    title: string
    excerpt?: string | null
    coverImageUrl?: string | null
    status?: string
    publishedAt?: string | null
  }>
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

function getPrimaryMedia(business?: BusinessDetail | null) {
  return (
    business?.mediaAssets?.find((item) => item.isPrimary) ||
    business?.mediaAssets?.[0] ||
    null
  )
}

function dedupeCategories(categories: MenuCategory[] = []) {
  const seen = new Map<number, MenuCategory>()

  for (const category of categories) {
    if (!seen.has(category.id)) {
      seen.set(category.id, category)
    }
  }

  return [...seen.values()]
}

function normalizeExternalLink(value?: string | null, platform?: string) {
  const trimmed = value?.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  if (trimmed.startsWith('@')) {
    const handle = trimmed.slice(1).trim().replace(/[^a-zA-Z0-9._-]/g, '')
    if (!handle) return null

    const base = platform === 'tiktok'
      ? 'https://www.tiktok.com/@'
      : platform === 'facebook'
        ? 'https://www.facebook.com/'
        : 'https://www.instagram.com/'

    return `${base}${handle}`
  }

  if (trimmed.startsWith('www.')) {
    return `https://${trimmed}`
  }

  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`
  }

  return null
}

export default function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [business, setBusiness] = useState<BusinessDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [customers, setCustomers] = useState<BusinessCommunityUser[]>([])
  const [followers, setFollowers] = useState<BusinessCommunityUser[]>([])

  useEffect(() => {
    async function loadBusiness() {
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
        const businessData = await getBusinessById<BusinessDetail>(businessId)
        setBusiness(businessData)

        // Load community previews
        await loadCommunityPreviews(businessId)
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'No pudimos cargar el detalle del negocio'))
      } finally {
        setLoading(false)
      }
    }

    loadBusiness()
  }, [id])

  async function loadCommunityPreviews(businessId: number) {
    try {
      const [customersRes, followersRes] = await Promise.all([
        getBusinessCustomers(businessId, 6, 1),
        getBusinessFollowers(businessId, 6, 1),
      ])

      setCustomers(customersRes.items)
      setFollowers(followersRes.items)
    } catch (error) {
      // Silently handle errors for community data
    }
  }

  function handleViewAllCustomers() {
    // This will be handled by the component
  }

  function handleViewAllFollowers() {
    // This will be handled by the component
  }

  useEffect(() => {
    if (!business?.id) return

    void trackEvent({
      eventType: 'BUSINESS_PROFILE_VIEW',
      entityType: 'business',
      entityId: business.id,
      sourceScreen: 'business_detail',
      metadata: { action: 'view_page' },
    })
  }, [business?.id])

  const coverImage = getPrimaryMedia(business)?.url

  const menuCategories = useMemo(() => {
    const menus = business?.menus ?? []
    return dedupeCategories(menus.flatMap((menu) => menu.categories ?? []))
  }, [business])

  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null)

  useEffect(() => {
    if (!menuCategories.length) {
      setActiveCategoryId(null)
      return
    }

    setActiveCategoryId((current) =>
      current && menuCategories.some((category) => category.id === current)
        ? current
        : menuCategories[0].id
    )
  }, [menuCategories])

  const activeCategory = useMemo(
    () => menuCategories.find((category) => category.id === activeCategoryId) ?? null,
    [activeCategoryId, menuCategories]
  )

  const feedProducts = useMemo<MenuProduct[]>(() => {
    const products = [...(activeCategory?.products ?? [])]
      .filter((product) => product.isActive !== false)
      .sort((left, right) => {
        const featuredDiff = Number(Boolean(right.isFeatured)) - Number(Boolean(left.isFeatured))

        if (featuredDiff !== 0) return featuredDiff

        return (left.sortOrder ?? 0) - (right.sortOrder ?? 0)
      })

    return products.slice(0, 8)
  }, [activeCategory])

  const highlightPromotion = useMemo(() => {
    return (
      business?.promotions?.find(
        (promotion) =>
          promotion.isHighlighted && promotion.status === 'ACTIVE'
      ) ||
      business?.promotions?.find((promotion) => promotion.status === 'ACTIVE') ||
      business?.promotions?.[0] ||
      null
    )
  }, [business])

  const activePromotions = useMemo(
    () =>
      (business?.promotions ?? [])
        .filter((promotion) => promotion.status === 'ACTIVE')
        .slice(0, 3),
    [business]
  )

  const whatsappUrl = useMemo(() => {
    const raw = business?.whatsapp || business?.phone
    if (!raw) return null

    const cleaned = sanitizeWhatsApp(raw)
    if (!cleaned) return null

    const message = encodeURIComponent(
      `Hola, quiero pedir en ${business?.name || 'este negocio'}.`
    )

    return `https://wa.me/${cleaned}?text=${message}`
  }, [business])

  const mediaAssets = business?.mediaAssets ?? []

  const galleryMedia = mediaAssets.filter((item) => item.url).slice(0, 6)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const profileImage =
    business?.profileImageUrl ||
    buildVisualImageDataUrl(business?.name || 'Negocio', business?.category || 'Negocio')
  const selectedGalleryMedia =
    selectedPhotoIndex !== null ? galleryMedia[selectedPhotoIndex] ?? null : null

  const socialLinks = [
    business?.website
      ? { label: 'Web', href: normalizeExternalLink(business.website, 'website') }
      : null,
    business?.instagram
      ? {
          label: 'Instagram',
          href: normalizeExternalLink(business.instagram, 'instagram'),
        }
      : null,
    business?.facebook
      ? {
          label: 'Facebook',
          href: normalizeExternalLink(business.facebook, 'facebook'),
        }
      : null,
    business?.tiktok
      ? { label: 'TikTok', href: normalizeExternalLink(business.tiktok, 'tiktok') }
      : null,
  ].filter((item): item is { label: string; href: string } => Boolean(item?.href))

  const publishedPosts = (business?.posts ?? [])
    .filter((post) => post.status === 'PUBLISHED')
    .slice(0, 4)

  const sectionTabs = [
    { id: 'menu', label: 'Carta' },
    { id: 'promociones', label: 'Ofertas' },
    { id: 'fotos', label: 'Fotos' },
    { id: 'reseñas', label: 'Reseñas' },
    { id: 'comunidad', label: 'Comunidad' },
    { id: 'detalles', label: 'Datos útiles' },
    { id: 'posts', label: 'Novedades' },
  ] as const

  const [activeSection, setActiveSection] = useState<(typeof sectionTabs)[number]['id']>('menu')

  const scrollToSection = (sectionId: (typeof sectionTabs)[number]['id']) => {
    setActiveSection(sectionId)
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const openBusinessWhatsapp = (message: string) => {
    const raw = business?.whatsapp || business?.phone
    if (!raw) return

    const cleaned = sanitizeWhatsApp(raw)
    if (!cleaned) return

    window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`, '_blank')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm text-slate-500">Cargando perfil del negocio...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            to="/businesses"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-green-700)] transition hover:text-[var(--brand-green-600)]"
          >
            <FaArrowLeft />
            Volver a negocios
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>No pudimos cargar el negocio</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    )
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            to="/businesses"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-green-700)] transition hover:text-[var(--brand-green-600)]"
          >
            <FaArrowLeft />
            Volver a negocios
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>No encontramos este negocio</CardTitle>
              <CardDescription>
                El negocio solicitado no existe o no está disponible por ahora.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-900">
      <Navbar
        brandName="Yebaam"
        brandHref="/"
        links={[
          { label: 'Negocios', href: '/businesses' },
          { label: 'Carta', href: '#menu' },
          { label: 'Fotos', href: '#fotos' },
          { label: 'Reseñas', href: '#reseñas' },
        ]}
        onLogin={() => navigate('/login')}
        onRegister={() => navigate('/register')}
      />

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="relative">
            <img
              src={
                coverImage ||
                buildVisualImageDataUrl(business.name, business.category || 'Negocio')
              }
              alt={business.name}
              className="h-[280px] w-full object-cover sm:h-[360px]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-slate-950/35" />

            <div className="absolute right-4 top-4 hidden gap-2 sm:flex">
              <Button
                size="sm"
                variant="ghost"
                className="bg-white/90 text-slate-900 hover:bg-white"
                onClick={() => {
                  if (whatsappUrl) {
                    void trackCtaClick({
                      businessId: business.id,
                      sourceScreen: 'business_detail_hero',
                    })
                    window.open(whatsappUrl, '_blank', 'noreferrer')
                  }
                }}
              >
                Pedir ahora
              </Button>
            </div>
          </div>

          <div className="relative bg-white px-4 pb-4 sm:px-6 lg:px-8">
            <div className="-mt-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 items-end gap-4">
                <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-xl">
                  <img
                    src={profileImage}
                    alt={`${business.name} perfil`}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="pb-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {business.businessType || business.category}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                      {business.name}
                    </h1>
                    {business.isVerified ? <VerifiedBadge /> : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {business.city}
                    {business.address ? ` · ${business.address}` : ''}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm">
                      <FaStar className="text-amber-500" />
                      {business.ratingAverage?.toFixed(1) ?? '0.0'} ·{' '}
                      {business.reviewsCount ?? 0} reseñas
                    </span>

                    <BusinessCustomerButton
                      businessId={business.id}
                      businessName={business.name}
                      initialIsCustomer={business.isCustomer ?? false}
                      initialCustomersCount={business.customersCount ?? 0}
                      onRequireAuth={() => navigate('/login')}
                      onStateChange={(isCustomer, customersCount) => {
                        setBusiness(prev => prev ? { ...prev, isCustomer, customersCount } : null)
                        loadCommunityPreviews(business.id)
                      }}
                    />

                    <BusinessFollowButton
                      businessId={business.id}
                      businessName={business.name}
                      initialIsFollowing={business.isFollowing ?? false}
                      initialFollowersCount={business.followersCount ?? 0}
                      onRequireAuth={() => navigate('/login')}
                      onStateChange={(isFollowing, followersCount) => {
                        setBusiness(prev => prev ? { ...prev, isFollowing, followersCount } : null)
                        loadCommunityPreviews(business.id)
                      }}
                    />

                    <BusinessLikeButton
                      businessId={business.id}
                      businessName={business.name}
                      initialHasLiked={business.hasLiked ?? false}
                      initialLikesCount={business.likesCount ?? 0}
                      onRequireAuth={() => navigate('/login')}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pb-2">
                <Button
                  onClick={() => {
                    if (whatsappUrl) {
                      void trackCtaClick({
                        businessId: business.id,
                        sourceScreen: 'business_detail_menu',
                      })
                      window.open(whatsappUrl, '_blank', 'noreferrer')
                    }
                  }}
                >
                  Pedir por WhatsApp
                </Button>
                <Button variant="outline" onClick={() => navigate(`/businesses/${business.id}/menu`)}>
                  Ver carta
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-label="Navegación interna"
          className="sticky top-16 z-30 mb-6 rounded-[1.5rem] border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80"
        >
          <div className="flex gap-2 overflow-x-auto">
            {sectionTabs.map((tab) => {
              const active = activeSection === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => scrollToSection(tab.id)}
                  aria-pressed={active}
                  className={[
                    'whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-semibold transition',
                    active
                      ? 'bg-[var(--brand-green-600)] text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                  ].join(' ')}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </section>

        <section
          id="menu"
          className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-stone-200 bg-[linear-gradient(180deg,#fffdf9_0%,#ffffff_100%)] p-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-green-700)]">
                Carta
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Explora los platos de {business.name}
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Fotos, precios y descripciones para elegir con calma y pedir sin dudas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/businesses/${business.id}/menu`)}
              >
                Ver carta completa
              </Button>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <div className="rounded-[1.5rem] border border-stone-200 bg-white/80 p-3">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Secciones
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Recorre la carta por categorías y mantén el antojo a la vista.
                  </p>
                </div>

                <p className="text-xs text-slate-500">
                  {menuCategories.length > 0
                    ? `${menuCategories.length} secciones disponibles`
                    : 'Sin secciones visibles'}
                </p>
              </div>

              {menuCategories.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {menuCategories.map((category) => {
                    const active = activeCategoryId === category.id

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setActiveCategoryId(category.id)}
                        aria-pressed={active}
                        className={[
                          'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition',
                          active
                            ? 'bg-[var(--brand-green-600)] text-white shadow-sm'
                            : 'border border-stone-200 bg-white text-slate-700 hover:border-stone-300 hover:text-slate-950',
                        ].join(' ')}
                      >
                        {category.name}
                        <span className={active ? 'ml-2 text-white/75' : 'ml-2 text-slate-400'}>
                          {category.products?.length ?? 0}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  Esta carta todavía no tiene secciones visibles.
                </div>
              )}
            </div>

            {feedProducts.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {feedProducts.map((product) => {
                  const productImage =
                    product.imageUrl ||
                    buildVisualImageDataUrl(product.name, activeCategory?.name || 'Plato')

                  return (
                    <article
                      key={product.id}
                      className="flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-stone-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)]"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                        <img
                          src={productImage}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-500 hover:scale-105"
                        />
                        {product.isFeatured ? (
                          <div className="absolute left-3 top-3">
                            <Badge variant="success">Recomendado</Badge>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-1 flex-col space-y-2.5 px-4 py-3.5">
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {activeCategory?.name || 'Carta'}
                          </p>
                          <h3 className="text-base font-semibold tracking-tight text-slate-950">
                            {product.name}
                          </h3>
                          {product.shortDescription || product.description ? (
                            <p className="line-clamp-2 text-xs leading-5 text-slate-600">
                              {product.shortDescription ||
                                product.description ||
                                'Un plato listo para descubrir.'}
                            </p>
                          ) : (
                            <p className="line-clamp-2 text-xs leading-5 text-slate-500">
                              Descripción pendiente por el negocio.
                            </p>
                          )}
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                          <span className="text-sm font-semibold text-slate-950">
                            {formatMenuPrice(product.price, product.currency || 'COP')}
                          </span>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/products/${product.id}`)}
                          >
                            Ver plato
                          </Button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8">
                <div className="max-w-2xl space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Carta visual
                  </p>
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                    Aún no hay platos visibles en esta sección
                  </h3>
                  <p className="text-sm leading-6 text-slate-600">
                    Cambia de sección o abre la carta completa para revisar todo el menú disponible.
                  </p>
                  <div className="pt-2">
                    <Button onClick={() => navigate(`/businesses/${business.id}/menu`)}>
                      Ver carta completa
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section
          id="promociones"
          className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <SectionHeader
            eyebrow="Ofertas"
            title="Promociones activas"
            description="Incentivos vigentes para que pedir se sienta más fácil y oportuno."
          />

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            {highlightPromotion ? (
              <Card className="overflow-hidden" padding="none">
                <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="warning">Activa</Badge>
                      {highlightPromotion.isHighlighted ? <Badge variant="success">Destacada</Badge> : null}
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                      {highlightPromotion.title}
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                      {highlightPromotion.description ||
                        'Una oferta activa para aprovechar en este negocio.'}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Button onClick={() => scrollToSection('menu')}>Ver carta</Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          openBusinessWhatsapp(
                            `Hola, vi la promoción "${highlightPromotion.title}" en ${business.name}.`
                          )
                        }
                      >
                        Preguntar por la oferta
                      </Button>
                    </div>
                  </div>

                  <div className="relative">
                    <img
                      src={
                        highlightPromotion.imageUrl ||
                        buildVisualImageDataUrl(highlightPromotion.title, business.category || 'Promoción')
                      }
                      alt={highlightPromotion.title}
                      className="h-full min-h-[240px] w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/35 via-transparent to-transparent" />
                  </div>
                </div>
              </Card>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8">
                <h3 className="text-lg font-semibold text-slate-950">Sin ofertas activas</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Cuando el negocio publique una promoción, la verás aquí como una buena razón para pedir.
                </p>
              </div>
            )}

            <div className="grid gap-4">
              {activePromotions.length > 0 ? (
                activePromotions.map((promotion) => (
                  <Card key={promotion.id} hoverable padding="none" className="overflow-hidden">
                    <div className="grid gap-0 sm:grid-cols-[130px_minmax(0,1fr)]">
                      <img
                        src={
                          promotion.imageUrl ||
                          buildVisualImageDataUrl(promotion.title, business.category || 'Promoción')
                        }
                        alt={promotion.title}
                        className="h-full min-h-[130px] w-full object-cover"
                      />
                      <div className="space-y-3 p-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="warning">Activa</Badge>
                          {promotion.isHighlighted ? <Badge variant="success">Destacada</Badge> : null}
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-slate-950">{promotion.title}</h4>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {promotion.description || 'Promoción vigente para este negocio.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8">
                  <p className="text-sm font-medium text-slate-900">No hay más ofertas activas</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    La oferta destacada es la mejor oportunidad disponible por ahora.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          id="fotos"
          className="scroll-mt-28 rounded-[2rem] border border-stone-200 bg-[linear-gradient(180deg,#fffdf9_0%,#ffffff_100%)] p-4 shadow-[0_12px_40px_rgba(15,23,42,0.04)]"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--brand-green-700)]">
                Fotos
              </p>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                Fotos del negocio
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Un vistazo a platos, ambiente y detalles para imaginar mejor la experiencia.
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (galleryMedia.length > 0) setSelectedPhotoIndex(0)
              }}
            >
              Ver fotos
            </Button>
          </div>

          <div className="mt-4">
            {galleryMedia.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {galleryMedia.slice(0, 8).map((media, index) => (
                  <button
                    key={media.id}
                    type="button"
                    onClick={() => setSelectedPhotoIndex(index)}
                    className="group relative aspect-square overflow-hidden rounded-[1.25rem] border border-stone-200 bg-stone-100 shadow-[0_6px_20px_rgba(15,23,42,0.04)]"
                    aria-label={`Abrir foto ${index + 1}`}
                  >
                    <img
                      src={media.url}
                      alt={media.altText || business.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-950/0 transition duration-300 group-hover:bg-slate-950/10" />
                  </button>
                ))}
                {galleryMedia.length > 8 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedPhotoIndex(7)}
                    className="group relative aspect-square overflow-hidden rounded-[1.25rem] border border-stone-200 bg-stone-100 shadow-[0_6px_20px_rgba(15,23,42,0.04)]"
                    aria-label="Abrir más fotos"
                  >
                    <img
                      src={galleryMedia[7].url}
                      alt={galleryMedia[7].altText || business.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-950/30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur">
                        +{galleryMedia.length - 7} fotos
                      </div>
                    </div>
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 p-5">
                <div className="max-w-xl space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Fotos
                  </p>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-950">
                    Aún no hay fotos disponibles
                  </h3>
                  <p className="text-sm leading-6 text-slate-600">
                    Pronto verás imágenes de la carta, el ambiente y los detalles del negocio.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section
          id="reseñas"
          className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <ReviewSection
            businessId={business.id}
          />
        </section>

        <section
          id="comunidad"
          className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <BusinessCommunitySection
            businessId={business.id}
            businessName={business.name}
            customersCount={business.customersCount ?? 0}
            followersCount={business.followersCount ?? 0}
            customers={customers}
            followers={followers}
            onViewAllCustomers={handleViewAllCustomers}
            onViewAllFollowers={handleViewAllFollowers}
          />
        </section>

        <section
          id="detalles"
          className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <SectionHeader
            eyebrow="Datos útiles"
            title="Conoce mejor el negocio"
            description="Información breve para ubicarlo, entender su propuesta y contactar sin fricción."
          />

          <div className="mt-6">
            <Card className="overflow-hidden border-stone-200 bg-white shadow-sm">
              <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.15fr)_320px] lg:items-start">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">Negocio local</Badge>
                      {business.businessType ? (
                        <Badge variant="neutral">{business.businessType}</Badge>
                      ) : null}
                    </div>

                    <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                      Una propuesta cercana, visible y fácil de contactar.
                    </h3>

                    <p className="max-w-2xl text-sm leading-6 text-slate-600">
                      {buildBusinessStory({
                        category: business.category,
                        city: business.city,
                        ratingAverage: business.ratingAverage,
                        reviewsCount: business.reviewsCount,
                        hasWhatsapp: Boolean(business.whatsapp || business.phone),
                      })}
                    </p>
                  </div>

                  <dl className="grid gap-3 sm:grid-cols-2">
                    <BusinessFact
                      label="Categoría"
                      value={business.category || 'Por definir'}
                    />
                    <BusinessFact
                      label="Ciudad"
                      value={business.city || 'Por definir'}
                    />
                    <BusinessFact
                      label="Dirección"
                      value={business.address || 'Por confirmar'}
                    />
                    <BusinessFact
                      label="Horario"
                      value="Horario por confirmar"
                    />
                  </dl>

                  {socialLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {socialLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Reputación
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Una señal rápida para decidir con confianza.
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-3xl font-semibold tracking-tight text-slate-950">
                        {business.ratingAverage?.toFixed(1) ?? '0.0'}
                      </p>
                      <p className="text-xs font-medium text-amber-500">
                        {business.reviewsCount ? `${business.reviewsCount} reseñas` : 'Sin reseñas aún'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const raw = business.whatsapp || business.phone
                        if (!raw) return
                        openBusinessWhatsapp(
                          `Hola, quiero conocer más sobre ${business.name}.`
                        )
                      }}
                    >
                      Contactar ahora
                    </Button>

                    {business.address ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const mapsQuery = encodeURIComponent(
                            `${business.address}${business.city ? `, ${business.city}` : ''}`
                          )
                          window.open(`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`, '_blank')
                        }}
                      >
                        Ver ubicación
                      </Button>
                    ) : null}
                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    {business.whatsapp || business.phone
                      ? 'Puedes contactar por WhatsApp o teléfono.'
                      : 'El negocio todavía no publicó un canal de contacto.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section
          id="posts"
          className="scroll-mt-28 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"
        >
          <SectionHeader
            eyebrow="Novedades"
            title="Lo último del negocio"
            description="Actualizaciones breves para conocer qué está pasando antes de decidir."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {publishedPosts.length > 0 ? (
              publishedPosts.map((post) => (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <img
                    src={post.coverImageUrl || profileImage}
                    alt={post.title}
                    className="h-48 w-full object-cover"
                  />
                  <div className="space-y-2 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Actualización
                    </p>
                    <h3 className="text-lg font-semibold text-slate-950">{post.title}</h3>
                    <p className="text-sm leading-6 text-slate-600">
                      {post.excerpt || 'El negocio compartió una novedad reciente.'}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 md:col-span-2 xl:col-span-3">
                <h3 className="text-lg font-semibold text-slate-950">Sin novedades por ahora</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Cuando el negocio comparta actualizaciones, aparecerán aquí para darte más contexto.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => scrollToSection('menu')}
          >
            Ver carta
          </Button>
          <Button
            fullWidth
            onClick={() => {
              if (whatsappUrl) {
                window.open(whatsappUrl, '_blank', 'noreferrer')
              } else {
                scrollToSection('menu')
              }
            }}
          >
            Pedir por WhatsApp
          </Button>
        </div>
      </div>

      <Modal
        open={selectedGalleryMedia !== null}
        onClose={() => setSelectedPhotoIndex(null)}
        size="xl"
        title="Fotos del negocio"
        description={selectedGalleryMedia?.altText || business.name}
      >
        {selectedGalleryMedia ? (
          <div className="space-y-4">
            <img
              src={selectedGalleryMedia.url}
              alt={selectedGalleryMedia.altText || business.name}
              className="max-h-[70vh] w-full rounded-[1.5rem] object-contain bg-stone-50"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                {selectedGalleryMedia.altText || 'Foto del negocio'}
              </p>
              <Button variant="outline" onClick={() => setSelectedPhotoIndex(null)}>
                Cerrar foto
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Footer />
    </div>
  )
}

function BusinessFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium leading-6 text-slate-900">{value}</p>
    </div>
  )
}

function buildBusinessStory({
  category,
  city,
  ratingAverage,
  reviewsCount,
  hasWhatsapp,
}: {
  category?: string | null
  city?: string | null
  ratingAverage?: number
  reviewsCount?: number
  hasWhatsapp: boolean
}) {
  const parts: string[] = []

  if (category) {
    parts.push(`Un negocio de ${category.toLowerCase()}`)
  } else {
    parts.push('Un negocio gastronómico local')
  }

  if (city) {
    parts.push(`en ${city}`)
  }

  if (hasWhatsapp) {
    parts.push('con atención por WhatsApp')
  }

  const ratingText =
    typeof ratingAverage === 'number' && !Number.isNaN(ratingAverage)
      ? ratingAverage.toFixed(1)
      : '0.0'

  if (reviewsCount && reviewsCount > 0) {
    parts.push(
      `con una reputación de ${ratingText} basada en ${reviewsCount} reseña${
        reviewsCount === 1 ? '' : 's'
      }.`
    )
  } else {
    parts.push(`con una reputación inicial de ${ratingText}, aún sin reseñas públicas.`)
  }

  return parts.join(' ')
}
