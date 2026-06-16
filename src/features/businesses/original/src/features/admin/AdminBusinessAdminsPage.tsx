import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaKey, FaPen, FaPowerOff, FaTrash } from 'react-icons/fa6'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card, {
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import {
  deleteBusinessAdmin,
  listBusinessAdmins,
  updateBusinessAdminPassword,
  updateBusinessAdminStatus,
  type BusinessAdminUser,
} from './api'
import { getStoredUser } from '../../lib/session'
import { getErrorMessage } from '../../lib/httpError'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(
    new Date(value)
  )
}

export default function AdminBusinessAdminsPage() {
  const user = getStoredUser()
  const isSuperAdmin = user?.role === 'ADMIN'
  const [admins, setAdmins] = useState<BusinessAdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [adminToDelete, setAdminToDelete] = useState<BusinessAdminUser | null>(null)
  const [adminForPassword, setAdminForPassword] = useState<BusinessAdminUser | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')

  async function loadAdmins() {
    try {
      setLoading(true)
      setError('')
      setAdmins(await listBusinessAdmins())
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No pudimos cargar los administradores'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isSuperAdmin) return
    loadAdmins()
  }, [isSuperAdmin])

  async function handleStatusChange(admin: BusinessAdminUser, isActive: boolean) {
    try {
      setSavingId(admin.id)
      const updated = await updateBusinessAdminStatus(admin.id, isActive)
      setAdmins((current) =>
        current.map((item) => (item.id === admin.id ? updated : item))
      )
    } catch (err: unknown) {
      window.alert(getErrorMessage(err, 'No pudimos actualizar el estado'))
    } finally {
      setSavingId(null)
    }
  }

  async function handlePasswordChange() {
    if (!adminForPassword) return

    if (newPassword.length < 6) {
      window.alert('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (newPassword !== newPasswordConfirm) {
      window.alert('Las contraseñas no coinciden.')
      return
    }

    try {
      setSavingId(adminForPassword.id)
      await updateBusinessAdminPassword(adminForPassword.id, newPassword)
      setAdminForPassword(null)
      setNewPassword('')
      setNewPasswordConfirm('')
    } catch (err: unknown) {
      window.alert(getErrorMessage(err, 'No pudimos cambiar la contraseña'))
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete() {
    if (!adminToDelete) return

    try {
      setSavingId(adminToDelete.id)
      await deleteBusinessAdmin(adminToDelete.id)
      setAdmins((current) => current.filter((item) => item.id !== adminToDelete.id))
      setAdminToDelete(null)
    } catch (err: unknown) {
      window.alert(getErrorMessage(err, 'No pudimos eliminar el administrador'))
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
            Administradores de negocios
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Crea accesos, asígnalos a negocios y controla quién puede entrar al panel.
          </p>
        </div>
        <Link to="/admin/business-admins/new">
          <Button>Crear administrador</Button>
        </Link>
      </div>

      <Card className="overflow-hidden" padding="none">
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Cargando administradores...</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : admins.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">Aún no hay administradores creados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Nombre</th>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Negocio asignado</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 font-semibold">Creado</th>
                  <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td className="px-5 py-4 font-medium text-slate-900">{admin.name}</td>
                    <td className="px-5 py-4 text-slate-600">{admin.email}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {admin.primaryBusiness?.name || 'Sin asignar'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={admin.isActive ? 'success' : 'neutral'}>
                        {admin.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(admin.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link to={`/admin/business-admins/${admin.id}/edit`}>
                          <Button size="sm" variant="outline" leftIcon={<FaPen />}>
                            Editar
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<FaKey />}
                          onClick={() => setAdminForPassword(admin)}
                        >
                          Contraseña
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<FaPowerOff />}
                          loading={savingId === admin.id}
                          onClick={() => handleStatusChange(admin, !admin.isActive)}
                        >
                          {admin.isActive ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          leftIcon={<FaTrash />}
                          onClick={() => setAdminToDelete(admin)}
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
        open={!!adminForPassword}
        onClose={() => {
          setAdminForPassword(null)
          setNewPassword('')
          setNewPasswordConfirm('')
        }}
        title="Cambiar contraseña"
        description="Por seguridad no se muestra la contraseña actual. Define una nueva clave temporal."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setAdminForPassword(null)
                setNewPassword('')
                setNewPasswordConfirm('')
              }}
            >
              Cancelar
            </Button>
            <Button
              loading={savingId === adminForPassword?.id}
              onClick={handlePasswordChange}
            >
              Guardar contraseña
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={newPasswordConfirm}
            onChange={(event) => setNewPasswordConfirm(event.target.value)}
          />
        </div>
      </Modal>

      <Modal
        open={!!adminToDelete}
        onClose={() => setAdminToDelete(null)}
        title="Eliminar o desvincular administrador"
        description="El usuario quedará inactivo y perderá sus relaciones con negocios."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdminToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={savingId === adminToDelete?.id}
              onClick={handleDelete}
            >
              Eliminar administrador
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          ¿Seguro que quieres eliminar o desvincular a{' '}
          <strong>{adminToDelete?.name}</strong>?
        </p>
      </Modal>
    </div>
  )
}
