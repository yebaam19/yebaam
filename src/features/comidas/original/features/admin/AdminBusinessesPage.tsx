import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaPen, FaPowerOff, FaTrash } from 'react-icons/fa6'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import {
  deleteBusinessById,
  listBusinessesForAdmin,
  updateBusinessStatus,
  type BusinessListItem,
} from '../businesses/api'
import { getStoredUser, removeBusinessIdFromStoredUser } from '../../lib/session'
import { getErrorMessage } from '../../lib/httpError'

type StatusFilter = 'all' | 'active' | 'inactive'

function formatDate(value?: string) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(
    new Date(value)
  )
}

export default function AdminBusinessesPage() {
  const user = getStoredUser()
  const isSuperAdmin = user?.role === 'ADMIN'
  const [businesses, setBusinesses] = useState<BusinessListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [businessToDelete, setBusinessToDelete] = useState<BusinessListItem | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  async function loadBusinesses() {
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

  useEffect(() => {
    if (!isSuperAdmin) return
    loadBusinesses()
  }, [isSuperAdmin])

  const filteredBusinesses = useMemo(() => {
    const term = search.trim().toLowerCase()

    return businesses.filter((business) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && business.isActive) ||
        (statusFilter === 'inactive' && !business.isActive)

      const searchable = [business.name, business.city, business.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return matchesStatus && (!term || searchable.includes(term))
    })
  }, [businesses, search, statusFilter])

  async function handleStatusChange(business: BusinessListItem, isActive: boolean) {
    try {
      setSavingId(business.id)
      const updated = await updateBusinessStatus<BusinessListItem>(business.id, isActive)
      setBusinesses((current) =>
        current.map((item) =>
          item.id === business.id ? { ...item, isActive: updated.isActive } : item
        )
      )
    } catch (err: unknown) {
      window.alert(getErrorMessage(err, 'No pudimos actualizar el estado'))
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete() {
    if (!businessToDelete || deleteConfirmation !== businessToDelete.name) return

    try {
      setSavingId(businessToDelete.id)
      await deleteBusinessById(businessToDelete.id)
      removeBusinessIdFromStoredUser(businessToDelete.id)
      setBusinesses((current) =>
        current.filter((item) => item.id !== businessToDelete.id)
      )
      setBusinessToDelete(null)
      setDeleteConfirmation('')
    } catch (err: unknown) {
      window.alert(getErrorMessage(err, 'No pudimos eliminar el negocio'))
    } finally {
      setSavingId(null)
    }
  }

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-500">
            Super administración
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Vitrinas gastronómicas
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Crea, revisa y administra los negocios publicados en la plataforma.
          </p>
        </div>
        <Link to="/admin/businesses/new">
          <Button>Crear negocio</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_220px]">
          <Input
            label="Buscar"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre, categoría o ciudad"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Estado</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden" padding="none">
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Cargando negocios...</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">Aún no hay negocios para mostrar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Nombre</th>
                  <th className="px-5 py-3 font-semibold">Ciudad</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 font-semibold">Administrador</th>
                  <th className="px-5 py-3 font-semibold">Productos</th>
                  <th className="px-5 py-3 font-semibold">Creado</th>
                  <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredBusinesses.map((business) => (
                  <tr key={business.id}>
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {business.name}
                      <p className="mt-1 text-xs font-normal text-slate-500">
                        {business.slug || business.category}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{business.city || '-'}</td>
                    <td className="px-5 py-4">
                      <Badge variant={business.isActive ? 'success' : 'neutral'}>
                        {business.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {business.primaryAdmin?.name || 'Sin asignar'}
                      {business.primaryAdmin?.email ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {business.primaryAdmin.email}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {business.productsCount ?? 0}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(business.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link to={`/admin/businesses/${business.id}/edit`}>
                          <Button size="sm" variant="outline" leftIcon={<FaPen />}>
                            Editar
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<FaPowerOff />}
                          loading={savingId === business.id}
                          onClick={() =>
                            handleStatusChange(business, !business.isActive)
                          }
                        >
                          {business.isActive ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          leftIcon={<FaTrash />}
                          onClick={() => setBusinessToDelete(business)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={!!businessToDelete}
        onClose={() => {
          setBusinessToDelete(null)
          setDeleteConfirmation('')
        }}
        title="Eliminar negocio definitivamente"
        description="Esta acción puede borrar productos, imágenes, carta, promociones y relaciones asociadas."
        closeOnOverlayClick={false}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setBusinessToDelete(null)
                setDeleteConfirmation('')
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={savingId === businessToDelete?.id}
              disabled={deleteConfirmation !== businessToDelete?.name}
              onClick={handleDelete}
            >
              Eliminar negocio
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Para confirmar la eliminación, escribe: <strong>{businessToDelete?.name}</strong>
          </p>
          <Input
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            placeholder={businessToDelete?.name || ''}
          />
        </div>
      </Modal>
    </div>
  )
}
