import { useEffect, useState } from 'react'
import Badge from '../../components/ui/Badge'
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { listAdminActivity, type AdminActivityItem } from './api'
import { getStoredUser } from '../../lib/session'
import { getErrorMessage } from '../../lib/httpError'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function AdminActivityPage() {
  const user = getStoredUser()
  const isSuperAdmin = user?.role === 'ADMIN'
  const [activity, setActivity] = useState<AdminActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadActivity() {
      if (!isSuperAdmin) return

      try {
        setLoading(true)
        setError('')
        setActivity(await listAdminActivity(80))
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'No pudimos cargar la actividad'))
      } finally {
        setLoading(false)
      }
    }

    loadActivity()
  }, [isSuperAdmin])

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso restringido</CardTitle>
          <CardDescription>
            Esta sección está disponible solo para superadministradores.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">
          Super administración
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Bitácora reciente
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Registro de acciones importantes realizadas dentro del panel.
        </p>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Cargando actividad...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : activity.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay actividad registrada.</p>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Badge variant="neutral">{item.action}</Badge>
                      <p className="mt-2 text-sm font-medium text-slate-900">
                        {item.message}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.entity}
                        {item.entityId ? ` #${item.entityId}` : ''}
                        {item.user ? ` · ${item.user.name}` : ''}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
