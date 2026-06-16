import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardStatCard from './components/DashboardStatCard'
import Button from '../../components/ui/Button'
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { getBusinessById } from '../businesses/api'
import { getPrimaryBusinessId, getStoredUser } from '../../lib/session'
import SuperAdminDashboardPage from './SuperAdminDashboardPage'
import { getErrorMessage } from '../../lib/httpError'

type AdminBusiness = {
  id: number
  name: string
  products?: Array<{ id: number }>
  mediaAssets?: Array<{ id: number }>
  reviews?: Array<{ id: number }>
  promotions?: Array<{ id: number }>
  ratingAverage?: number
  reviewsCount?: number
}

export default function AdminDashboardPage() {
  const user = getStoredUser()

  if (user?.role === 'ADMIN') {
    return <SuperAdminDashboardPage />
  }

  return <BusinessAdminDashboardPage />
}

function BusinessAdminDashboardPage() {
  const businessId = getPrimaryBusinessId()
  const navigate = useNavigate()
  const user = getStoredUser()
  const [business, setBusiness] = useState<AdminBusiness | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      if (!businessId) {
        setError('Esta cuenta todavía no tiene un negocio asociado.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        const data = await getBusinessById<AdminBusiness>(businessId)
        setBusiness(data)
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'No pudimos cargar el panel administrativo'))
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [businessId])

  const stats = useMemo(() => {
    const products = business?.products?.length ?? 0
    const media = business?.mediaAssets?.length ?? 0
    const promotions = business?.promotions?.length ?? 0
    const reviews = business?.reviews?.length ?? 0

    return { products, media, promotions, reviews }
  }, [business])

  if (loading) {
    return <div className="space-y-8">Cargando panel...</div>
  }

  if (!businessId && user?.role === 'ADMIN') {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">
            Resumen
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Super administrador
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Aún no has creado un negocio. Empieza publicando la primera vitrina.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Crear la primera vitrina</CardTitle>
            <CardDescription>
              Registra el negocio, define su portada y deja lista la base para su carta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/admin/business/new')}>
              Crear negocio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">
          Resumen
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Resumen de tu vitrina
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Revisa productos, fotos, promociones y reseñas del negocio asociado a tu cuenta.
        </p>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>No pudimos cargar el panel</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardStatCard
              label="Productos"
              value={stats.products}
              hint="Catálogo real"
            />
            <DashboardStatCard
              label="Galería"
              value={stats.media}
              hint="Fotos y videos"
            />
            <DashboardStatCard
              label="Promociones"
              value={stats.promotions}
              hint="Vigentes o anteriores"
            />
            <DashboardStatCard
              label="Reseñas"
              value={business?.reviewsCount ?? stats.reviews}
              trend={
                business?.ratingAverage
                  ? `${business.ratingAverage.toFixed(1)}/5`
                  : undefined
              }
              hint="Reputación visible"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Negocio actual</CardTitle>
                <CardDescription>
                  Información conectada a la vitrina publicada.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  {business?.name || 'Sin negocio asociado'}
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  ID: {businessId ?? 'No disponible'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Próximas tareas sugeridas</CardTitle>
                <CardDescription>
                  Mantén tu perfil fresco y útil para quien está por pedir.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {[
                  'Actualizar datos del negocio',
                  'Crear un producto nuevo',
                  'Subir fotos recientes',
                  'Revisar promociones activas',
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
