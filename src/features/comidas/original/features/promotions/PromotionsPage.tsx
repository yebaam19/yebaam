import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/shared/Navbar'
import Footer from '../../components/shared/Footer'
import Button from '../../components/ui/Button'
import Card, { CardContent } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { listPromotions, type PromotionRecord } from './api'
import PromotionSection from './components/PromotionSection'
import type { PromotionCardData } from './components/PromotionCard'
import { getErrorMessage } from '../../lib/httpError'

function buildFallbackPromotionImage(title: string) {
  const safeTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#111827" />
          <stop offset="100%" stop-color="#f97316" />
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#g)" />
      <circle cx="1040" cy="160" r="140" fill="rgba(255,255,255,0.12)" />
      <circle cx="190" cy="620" r="180" fill="rgba(255,255,255,0.08)" />
      <text x="80" y="580" fill="#ffffff" font-family="Arial, sans-serif" font-size="74" font-weight="700">
        ${safeTitle}
      </text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function formatDateLabel(value?: string | null) {
  if (!value) return undefined

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function mapPromotionToCard(promotion: PromotionRecord): PromotionCardData {
  return {
    id: promotion.id,
    title: promotion.title,
    description: promotion.description || 'Una oferta activa para aprovechar en este negocio.',
    imageUrl:
      promotion.imageUrl ||
      buildFallbackPromotionImage(promotion.title || promotion.business?.name || 'Promoción'),
    businessName: promotion.business?.name || 'Negocio',
    discountLabel:
      promotion.ctaLabel ||
      (promotion.status === 'ACTIVE' ? 'Activa' : promotion.status === 'DRAFT' ? 'Borrador' : undefined),
    expiresAtLabel: formatDateLabel(promotion.endsAt),
    isHighlighted: promotion.isHighlighted,
  }
}

export default function PromotionsPage() {
  const navigate = useNavigate()
  const [promotions, setPromotions] = useState<PromotionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPromotions() {
      try {
        setLoading(true)
        setError('')
        const items = await listPromotions({ status: 'ACTIVE' })
        setPromotions(items)
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'No pudimos cargar las ofertas'))
      } finally {
        setLoading(false)
      }
    }

    loadPromotions()
  }, [])

  const cards = useMemo(() => promotions.map(mapPromotionToCard), [promotions])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar
        brandName="Yebaam"
        brandHref="/"
        links={[
          { label: 'Inicio', href: '/' },
          { label: 'Negocios', href: '/businesses' },
          { label: 'Ofertas', href: '/promotions', isActive: true },
        ]}
        onLogin={() => navigate('/login')}
        onRegister={() => navigate('/register')}
      />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">
              Ofertas activas
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Promociones para decidir y pedir con más ganas.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Campañas publicadas por negocios locales, con contexto suficiente para abrir
              la carta o contactar sin perder el hilo.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button onClick={() => navigate('/businesses')}>Explorar negocios</Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Ir al inicio
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loading ? (
          <Card>
            <CardContent className="p-6 text-sm text-slate-500">
              Cargando ofertas...
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-sm text-red-600">{error}</CardContent>
          </Card>
        ) : cards.length === 0 ? (
          <EmptyState
            title="Aún no hay ofertas activas"
            description="Cuando los negocios publiquen campañas vigentes, las verás aquí."
            actionLabel="Explorar negocios"
            onAction={() => navigate('/businesses')}
          />
        ) : (
          <PromotionSection
            eyebrow="Ofertas"
            title="Promociones listas para aprovechar"
            description="Cada oferta conserva el contexto del negocio para que puedas pasar de mirar a pedir."
            items={cards}
            onSelectPromotion={(id) => {
              navigate(`/promotions/${id}`)
            }}
          />
        )}
      </section>

      <Footer />
    </main>
  )
}
