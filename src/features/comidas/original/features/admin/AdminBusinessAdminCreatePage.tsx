import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card, { CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { listBusinessesForAdmin, type BusinessListItem } from '../businesses/api'
import { createBusinessAdmin } from './api'
import BusinessAdminForm, {
  type BusinessAdminFormValues,
} from './components/BusinessAdminForm'
import { getStoredUser } from '../../lib/session'
import { getErrorMessage } from '../../lib/httpError'

export default function AdminBusinessAdminCreatePage() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const isSuperAdmin = user?.role === 'ADMIN'
  const [businesses, setBusinesses] = useState<BusinessListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadBusinesses() {
      if (!isSuperAdmin) return

      try {
        setLoading(true)
        setError('')
        setBusinesses(await listBusinessesForAdmin())
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'No pudimos cargar los negocios'))
      } finally {
        setLoading(false)
      }
    }

    loadBusinesses()
  }, [isSuperAdmin])

  async function handleSubmit(values: BusinessAdminFormValues) {
    try {
      setSaving(true)
      await createBusinessAdmin({
        name: values.name,
        email: values.email,
        password: values.password,
        isActive: values.isActive,
        businessId: values.businessId,
      })
      navigate('/admin/business-admins', { replace: true })
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No pudimos crear el administrador'))
    } finally {
      setSaving(false)
    }
  }

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso restringido</CardTitle>
          <CardDescription>Solo un superadministrador puede crear administradores.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">
            Super administración
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Crear administrador de negocio
          </h1>
        </div>
        <Link to="/admin/business-admins">
          <Button variant="outline">Volver</Button>
        </Link>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando negocios disponibles...</p>
      ) : (
        <BusinessAdminForm
          mode="create"
          businesses={businesses}
          loading={saving}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
