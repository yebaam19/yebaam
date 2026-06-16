import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Card, { CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { listBusinessesForAdmin, type BusinessListItem } from '../businesses/api'
import {
  getBusinessAdminById,
  updateBusinessAdmin,
  updateBusinessAdminPassword,
  type BusinessAdminUser,
} from './api'
import BusinessAdminForm, {
  type BusinessAdminFormValues,
} from './components/BusinessAdminForm'
import { getStoredUser } from '../../lib/session'
import { getErrorMessage } from '../../lib/httpError'

export default function AdminBusinessAdminEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = getStoredUser()
  const isSuperAdmin = user?.role === 'ADMIN'
  const [businesses, setBusinesses] = useState<BusinessListItem[]>([])
  const [admin, setAdmin] = useState<BusinessAdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function load() {
      if (!id || !isSuperAdmin) return

      try {
        setLoading(true)
        setError('')
        const [adminData, businessData] = await Promise.all([
          getBusinessAdminById(id),
          listBusinessesForAdmin(),
        ])
        setAdmin(adminData)
        setBusinesses(businessData)
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'No pudimos cargar el administrador'))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id, isSuperAdmin])

  async function handleSubmit(values: BusinessAdminFormValues) {
    if (!id) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')
      const updated = await updateBusinessAdmin(id, {
        name: values.name,
        email: values.email,
        isActive: values.isActive,
        businessId: values.businessId,
      })

      if (values.password) {
        await updateBusinessAdminPassword(id, values.password)
      }

      setAdmin(updated)
      setSuccess('El administrador se actualizó correctamente.')
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No pudimos guardar el administrador'))
    } finally {
      setSaving(false)
    }
  }

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso restringido</CardTitle>
          <CardDescription>Solo un superadministrador puede editar administradores.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (loading) return <div>Cargando administrador...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">
            Super administración
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Editar administrador de negocio
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

      {success ? (
        <Card>
          <CardHeader>
            <CardTitle>Guardado</CardTitle>
            <CardDescription>{success}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {admin ? (
        <BusinessAdminForm
          mode="edit"
          businesses={businesses}
          loading={saving}
          initialValues={{
            name: admin.name,
            email: admin.email,
            isActive: admin.isActive,
            businessId: admin.primaryBusiness?.id ?? null,
          }}
          onSubmit={handleSubmit}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Administrador no encontrado</CardTitle>
            <CardDescription>No encontramos el administrador solicitado.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Button variant="ghost" onClick={() => navigate('/admin/business-admins')}>
        Volver a administradores
      </Button>
    </div>
  )
}
