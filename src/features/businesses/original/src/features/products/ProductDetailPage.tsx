import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../../components/shared/Navbar'
import Footer from '../../components/shared/Footer'
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import ProductDetailHero from './components/ProductDetailHero'
import ProductInfoPanel from './components/ProductInfoPanel'
import { getProductById } from './api'
import { buildVisualImageDataUrl } from '../../lib/visualImage'
import { trackCtaClick, trackEvent } from '../../lib/analytics'
import { getErrorMessage } from '../../lib/httpError'

type ProductBusiness = {
  id: number
  name: string
  category?: string | null
  city?: string | null
  whatsapp?: string | null
  isActive: boolean
}

type ProductCategory = {
  id: number
  name: string
  menuId: number
}

type ProductDetail = {
  id: number
  businessId: number
  categoryId: number
  name: string
  slug: string
  shortDescription?: string | null
  description?: string | null
  ingredients?: string | null
  price: number | string
  imageUrl?: string | null
  sortOrder?: number
  isFeatured?: boolean
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  business?: ProductBusiness
  category?: ProductCategory
}

function sanitizeWhatsApp(value: string) {
  return value.replace(/[^\d]/g, '')
}

function formatPrice(value: number | string) {
  const numericValue = typeof value === 'string' ? Number(value) : value

  if (Number.isNaN(numericValue)) {
    return String(value)
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numericValue)
}

function splitIngredients(value?: string | null) {
  if (!value) return []

  return value
    .split(/[\n,•]/g)
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProduct() {
      if (!id) {
        setError('No recibimos el identificador del producto')
        setLoading(false)
        return
      }

      const productId = Number(id)

      if (Number.isNaN(productId)) {
        setError('El identificador del producto no es válido')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')

        setProduct(await getProductById<ProductDetail>(productId))
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'No pudimos cargar el detalle del producto'))
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id])

  useEffect(() => {
    if (!product?.id) return

    void trackEvent({
      eventType: 'PRODUCT_VIEW',
      entityType: 'product',
      entityId: product.id,
      sourceScreen: 'product_detail',
      metadata: { action: 'view_page' },
    })
  }, [product?.id])

  const ingredients = useMemo(
    () => splitIngredients(product?.ingredients),
    [product?.ingredients]
  )

  const whatsappUrl = useMemo(() => {
    const raw = product?.business?.whatsapp
    if (!raw) return null

    const cleaned = sanitizeWhatsApp(raw)
    if (!cleaned) return null

    const message = encodeURIComponent(
      `Hola, quiero pedir el producto "${product?.name}" de ${product?.business?.name || 'su negocio'}.`
    )

    return `https://wa.me/${cleaned}?text=${message}`
  }, [product])

  const heroImage = product?.imageUrl || undefined
  const heroFallbackImage = buildVisualImageDataUrl(
    product?.name || 'Producto',
    product?.category?.name || 'Producto'
  )

  const businessLocation = [product?.business?.category, product?.business?.city]
    .filter(Boolean)
    .join(' · ')

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm text-slate-500">Cargando detalle del producto...</p>
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
            className="mb-4 inline-flex text-sm font-medium text-orange-600 transition hover:text-orange-700"
          >
            ← Volver a negocios
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>No se pudo cargar el producto</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Footer />
      </main>
    )
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            to="/businesses"
            className="mb-4 inline-flex text-sm font-medium text-orange-600 transition hover:text-orange-700"
          >
            ← Volver a negocios
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Producto no encontrado</CardTitle>
              <CardDescription>
                El producto no existe o no está disponible en este momento.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Footer />
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/businesses"
            className="inline-flex text-sm font-medium text-orange-600 transition hover:text-orange-700"
          >
            ← Volver a negocios
          </Link>

          {product.business?.id ? (
            <Link
              to={`/businesses/${product.business.id}`}
              className="inline-flex text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              Ver perfil del negocio
            </Link>
          ) : null}
        </div>

        <ProductDetailHero
          name={product.name}
          imageUrl={heroImage}
          fallbackImageUrl={heroFallbackImage}
          price={product.price}
          category={product.category?.name || 'Producto'}
          shortDescription={product.shortDescription || product.description || ''}
          isAvailable={product.isActive && product.business?.isActive !== false}
          isPopular={product.isFeatured ?? false}
          businessName={product.business?.name}
          businessId={product.business?.id}
          primaryDisabled={!whatsappUrl}
          onPrimaryAction={() => {
            if (whatsappUrl) {
              void trackCtaClick({
                businessId: product.business?.id || product.businessId,
                productId: product.id,
                sourceScreen: 'product_detail_primary',
              })
              window.open(whatsappUrl, '_blank', 'noreferrer')
            }
          }}
          onSecondaryAction={() => {
            if (product.business?.id) {
              void trackEvent({
                eventType: 'BUSINESS_PROFILE_VIEW',
                entityType: 'business',
                entityId: product.business.id,
                sourceScreen: 'product_detail',
                metadata: { action: 'view_business' },
              })
              navigate(`/businesses/${product.business.id}`)
            }
          }}
        />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-8">
            <ProductInfoPanel
              description={product.description || product.shortDescription || ''}
              ingredients={ingredients}
              category={product.category?.name}
              availabilityLabel={product.isActive ? 'Disponible' : 'No disponible'}
              notes={
                product.business?.city
                  ? `Disponible en ${product.business.city}`
                  : 'Información compartida por el negocio.'
              }
              tags={[
                product.isFeatured ? 'Destacado' : '',
                product.business?.isActive === false ? 'Negocio inactivo' : 'Activo',
              ].filter(Boolean) as string[]}
            />

            <Card>
              <CardHeader>
              <CardTitle>Lo prepara este negocio</CardTitle>
              <CardDescription>
                  Datos clave para que sepas de dónde viene el producto antes de pedir.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>{product.business?.name || 'Sin negocio'}</Badge>
                  {product.business?.category ? (
                    <Badge variant="success">{product.business.category}</Badge>
                  ) : null}
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-900">Precio:</span>{' '}
                    {formatPrice(product.price)}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Estado:</span>{' '}
                    {product.isActive ? 'Disponible' : 'No disponible'}
                  </p>
                  {businessLocation ? (
                    <p>
                      <span className="font-semibold text-slate-900">
                        Ubicación:
                      </span>{' '}
                      {businessLocation}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3">
                  {product.business?.id ? (
                    <Link
                      to={`/businesses/${product.business.id}`}
                      className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-base font-medium text-white shadow-sm transition hover:bg-slate-800"
                    >
                      Abrir perfil
                    </Link>
                  ) : null}

                  {product.business?.id ? (
                    <Link
                      to={`/businesses/${product.business.id}/gallery`}
                      className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-base font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Ver fotos
                    </Link>
                  ) : null}

                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    disabled={!whatsappUrl}
                    onClick={() => {
                      if (whatsappUrl) {
                        window.open(whatsappUrl, '_blank', 'noreferrer')
                      }
                    }}
                  >
                    {whatsappUrl ? 'Pedir por WhatsApp' : 'Contacto no disponible'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-24">
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="space-y-5 p-5">
                <div>
                  <CardTitle className="text-xl">
                    {whatsappUrl ? 'Listo para pedir' : 'Contacto no disponible'}
                  </CardTitle>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {whatsappUrl
                      ? 'Abre una conversación directa con el negocio para confirmar tu pedido.'
                      : 'Este producto todavía no tiene un WhatsApp asociado.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">
                      {product.business?.name || 'Negocio'}
                    </p>
                    <p className="mt-1">
                      {product.category?.name || 'Categoría por definir'}{' '}
                      {product.business?.city ? `· ${product.business.city}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      size="lg"
                      fullWidth
                      disabled={!whatsappUrl}
                      onClick={() => {
                        if (whatsappUrl) {
                          window.open(whatsappUrl, '_blank', 'noreferrer')
                        }
                      }}
                    >
                      {whatsappUrl ? 'Pedir por WhatsApp' : 'Contacto no disponible'}
                    </Button>

                    {product.business?.id ? (
                      <Link
                        to={`/businesses/${product.business.id}`}
                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-base font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Abrir perfil
                      </Link>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
