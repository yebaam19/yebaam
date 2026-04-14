'use client'

import { useState, useTransition } from 'react'
import { grantPlatformAdminByUsername } from '@/features/foro/actions/admin.actions'
import type { ForoAuthor } from '@/features/foro/types'

interface Props {
  initial: ForoAuthor[]
}

export default function PlatformStaffPanel({ initial }: Props) {
  const [staff, setStaff] = useState(initial)
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleGrant = (e: React.FormEvent) => {
    e.preventDefault()
    const value = username.trim()
    if (!value) return
    setError(null)
    startTransition(async () => {
      const result = await grantPlatformAdminByUsername(value)
      if (!result.ok) {
        setError(result.error ?? 'No se pudo añadir.')
        return
      }
      if (result.user) {
        setStaff((prev) =>
          prev.some((u) => u.id === result.user!.id) ? prev : [...prev, result.user!],
        )
      }
      setUsername('')
    })
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <header className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Administradores de la plataforma
        </h2>
      </header>
      {error && (
        <p className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}
      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {staff.length === 0 ? (
          <li className="px-4 py-6 text-sm text-neutral-500">Sin administradores todavía.</li>
        ) : (
          staff.map((user) => (
            <li key={user.id} className="px-4 py-3 text-sm">
              <div className="font-medium text-neutral-900 dark:text-neutral-100">
                {user.displayName}
              </div>
              <div className="text-xs text-neutral-500">@{user.username}</div>
            </li>
          ))
        )}
      </ul>
      <form
        onSubmit={handleGrant}
        className="flex gap-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800"
      >
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Añadir por @username"
          className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />
        <button
          type="submit"
          disabled={isPending || !username.trim()}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          Añadir
        </button>
      </form>
    </section>
  )
}
