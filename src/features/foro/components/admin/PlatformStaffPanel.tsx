'use client'

import { useState, useTransition } from 'react'
import {
  grantForumStaffByUsername,
  revokeForumStaff,
} from '@/features/foro/actions/admin.actions'
import type { ForoGlobalStaff, ForoRoleType } from '@/features/foro/types'

interface Props {
  initial: ForoGlobalStaff[]
}

const ROLE_LABEL: Record<ForoRoleType, string> = {
  admin: 'Administrador',
  moderator: 'Moderador',
}

export default function PlatformStaffPanel({ initial }: Props) {
  const [staff, setStaff] = useState<ForoGlobalStaff[]>(initial)
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<ForoRoleType>('moderator')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleGrant = (e: React.FormEvent) => {
    e.preventDefault()
    const value = username.trim().replace(/^@/, '')
    if (!value) return
    setError(null)
    startTransition(async () => {
      const result = await grantForumStaffByUsername(value, role)
      if (!result.ok) {
        setError(result.error ?? 'No se pudo añadir.')
        return
      }
      if (result.user) {
        const granted: ForoGlobalStaff = {
          role,
          user: result.user,
          grantedAt: new Date().toISOString(),
        }
        setStaff((prev) => {
          const rest = prev.filter((s) => s.user.id !== result.user!.id)
          return [...rest, granted]
        })
      }
      setUsername('')
    })
  }

  const handleRevoke = (userId: string) => {
    setError(null)
    startTransition(async () => {
      const result = await revokeForumStaff(userId)
      if (!result.ok) {
        setError(result.error ?? 'No se pudo quitar.')
        return
      }
      setStaff((prev) => prev.filter((s) => s.user.id !== userId))
    })
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <header className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Permisos de foros
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          Otorga acceso a gestionar foros como moderador o administrador.
        </p>
      </header>
      {error && (
        <p className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}
      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {staff.length === 0 ? (
          <li className="px-4 py-6 text-sm text-neutral-500">Sin usuarios con permisos todavía.</li>
        ) : (
          staff.map((entry) => (
            <li
              key={entry.user.id}
              className="flex items-start justify-between gap-3 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-neutral-900 dark:text-neutral-100">
                  {entry.user.displayName}
                </div>
                <div className="truncate text-xs text-neutral-500">@{entry.user.username}</div>
                <div className="mt-1 inline-flex rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {ROLE_LABEL[entry.role]}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRevoke(entry.user.id)}
                disabled={isPending}
                className="shrink-0 rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Quitar
              </button>
            </li>
          ))
        )}
      </ul>
      <form
        onSubmit={handleGrant}
        className="flex flex-col gap-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Añadir por @username"
            className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as ForoRoleType)}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-950"
          >
            <option value="moderator">Moderador</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isPending || !username.trim()}
          className="self-end rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
        >
          Añadir
        </button>
      </form>
    </section>
  )
}
