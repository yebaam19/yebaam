'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { UserPlus, Trash2, Crown, Shield } from 'lucide-react'
import { addBusinessAdmin, removeBusinessAdmin } from '../../actions/business-admin.actions'
import type { BusinessAdmin } from '../../types'

interface Props {
  businessId: string
  admins: BusinessAdmin[]
}

const INPUT =
  'w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 ' +
  'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20'

export function BusinessAdminForm({ businessId, admins }: Props) {
  const [email, setEmail]       = useState('')
  const [isPending, start]      = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    start(async () => {
      try {
        await addBusinessAdmin(businessId, trimmed)
        toast.success('Administrador añadido correctamente')
        setEmail('')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al añadir')
      }
    })
  }

  function handleRemove(admin: BusinessAdmin) {
    if (admin.is_primary) return
    if (!confirm(`¿Quitar acceso de administrador a ${admin.display_name ?? 'este usuario'}?`)) return
    setRemovingId(admin.user_id)
    start(async () => {
      try {
        await removeBusinessAdmin(businessId, admin.user_id)
        toast.success('Administrador eliminado')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al eliminar')
      } finally {
        setRemovingId(null)
      }
    })
  }

  return (
    <div className="space-y-8 max-w-xl">

      {/* Lista de admins actuales */}
      <section aria-label="Administradores actuales">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Acceso actual
        </h2>

        {admins.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-10 text-center">
            <p className="text-3xl" aria-hidden>👥</p>
            <p className="mt-3 text-sm text-neutral-500">Sin administradores asignados.</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {admins.map((admin) => (
              <li key={admin.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                  {admin.is_primary
                    ? <Crown size={16} className="text-amber-500" aria-hidden />
                    : <Shield size={16} aria-hidden />
                  }
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {admin.display_name ?? admin.user_id}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {admin.is_primary ? 'Admin principal' : admin.title ?? 'Co-administrador'}
                    {' · '}
                    {[
                      admin.can_manage_menu       && 'Menú',
                      admin.can_manage_media      && 'Media',
                      admin.can_manage_promotions && 'Promos',
                      admin.can_manage_posts      && 'Posts',
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>

                {!admin.is_primary && (
                  <button
                    type="button"
                    disabled={isPending && removingId === admin.user_id}
                    onClick={() => handleRemove(admin)}
                    aria-label={`Quitar a ${admin.display_name ?? 'este admin'}`}
                    className="shrink-0 rounded-lg p-2 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Invitar nuevo admin */}
      <section aria-label="Añadir administrador">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Añadir co-administrador
        </h2>
        <form onSubmit={handleAdd} className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="admin-email" className="sr-only">
              Email del usuario en Yebaam
            </label>
            <input
              id="admin-email"
              type="email"
              required
              placeholder="email@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT}
              aria-describedby="admin-email-hint"
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !email.trim()}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-primary-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <UserPlus size={15} aria-hidden />
            <span className="hidden sm:inline">Añadir</span>
          </button>
        </form>
        <p id="admin-email-hint" className="mt-2 text-xs text-neutral-400">
          El usuario debe tener una cuenta activa en Yebaam. Recibirá acceso completo al panel de administración excepto la gestión de administradores.
        </p>
      </section>
    </div>
  )
}
