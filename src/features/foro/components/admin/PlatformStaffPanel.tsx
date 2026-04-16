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
    <section className="min-w-0 rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <header className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Permisos de foros
          </h2>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {staff.length}
          </span>
        </div>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Otorga acceso para moderar o administrar foros en toda la plataforma.
        </p>
      </header>
      {error && (
        <p className="border-b border-red-200 bg-red-50 px-5 py-2.5 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}
      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {staff.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-neutral-500">
            Sin usuarios con permisos todavía.
          </li>
        ) : (
          staff.map((entry) => (
            <li
              key={entry.user.id}
              className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium text-neutral-900 dark:text-neutral-100">
                    {entry.user.displayName}
                  </span>
                  <span
                    className={
                      entry.role === 'admin'
                        ? 'inline-flex rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary-700 uppercase dark:bg-primary-900/30 dark:text-primary-300'
                        : 'inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-neutral-600 uppercase dark:bg-neutral-800 dark:text-neutral-300'
                    }
                  >
                    {ROLE_LABEL[entry.role]}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-neutral-500">
                  @{entry.user.username}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRevoke(entry.user.id)}
                disabled={isPending}
                className="shrink-0 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-red-900/60 dark:hover:bg-red-900/20 dark:hover:text-red-300"
              >
                Quitar
              </button>
            </li>
          ))
        )}
      </ul>
      <form
        onSubmit={handleGrant}
        className="flex flex-col gap-3 border-t border-neutral-200 bg-neutral-50/50 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900/40"
      >
        <label className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
          Añadir usuario
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as ForoRoleType)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          >
            <option value="moderator">Moderador</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isPending || !username.trim()}
          className="self-end rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-500 disabled:opacity-50"
        >
          Añadir
        </button>
      </form>
    </section>
  )
}
