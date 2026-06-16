import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { getAdminDashboard, type AdminDashboardMetrics } from './api'
import { getErrorMessage } from '../../lib/httpError'

const emptyMetrics: AdminDashboardMetrics = {
  totalBusinesses: 0,
  activeBusinesses: 0,
  inactiveBusinesses: 0,
  totalBusinessAdmins: 0,
  totalProducts: 0,
  totalReviews: 0,
  recentActivity: [],
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function SuperAdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics>(emptyMetrics)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        setError('')
        setMetrics(await getAdminDashboard())
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'No pudimos cargar el panel global'))
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const cards = [
    { label: 'Negocios totales', value: metrics.totalBusinesses },
    { label: 'Activos', value: metrics.activeBusinesses },
    { label: 'Inactivos', value: metrics.inactiveBusinesses },
    { label: 'Administradores', value: metrics.totalBusinessAdmins },
    { label: 'Productos', value: metrics.totalProducts },
    { label: 'Reseñas', value: metrics.totalReviews },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">
            Super administración
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Resumen global
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Vista general de negocios, administradores, productos y actividad reciente.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/businesses/new">
            <Button>Crear negocio</Button>
          </Link>
          <Link to="/admin/business-admins/new">
            <Button variant="outline">Crear administrador</Button>
          </Link>
        </div>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>No pudimos cargar el panel</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-3xl">
                {loading ? '...' : card.value.toLocaleString('es-CO')}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>Últimos eventos relevantes del panel.</CardDescription>
          </div>
          <Link to="/admin/activity" className="text-sm font-semibold text-orange-600">
            Ver todo
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Cargando actividad...</p>
          ) : metrics.recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay actividad registrada.</p>
          ) : (
            <div className="space-y-3">
              {metrics.recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Badge variant="neutral">{item.action}</Badge>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {item.message}
                    </p>
                    {item.user ? (
                      <p className="mt-1 text-xs text-slate-500">Por {item.user.name}</p>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
