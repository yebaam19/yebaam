'use client'

import { useState, useTransition } from 'react'
import { addForumRole, removeForumRole } from '@/features/foro/actions/admin.actions'
import type { ForoRoleMember, ForoRoleType, ForoSpace } from '@/features/foro/types'
import { formatRelativeDate } from '@/features/foro/utils/format'

interface Props {
  space: ForoSpace
  initial: ForoRoleMember[]
}

export default function ModeratorsAdmin({ space, initial }: Props) {
  const [members, setMembers] = useState(initial)
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<ForoRoleType>('moderator')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const value = username.trim()
    if (!value) return
    setError(null)
    startTransition(async () => {
      const result = await addForumRole({ spaceId: space.id, username: value, role })
      if (!result.ok) {
        setError(result.error ?? 'Error')
        return
      }
      // Optimistic row will refresh on next navigation; for now, insert a placeholder
      setMembers((prev) => [
        ...prev,
        {
          spaceId: space.id,
          userId: `temp-${value}`,
          role,
          grantedAt: new Date().toISOString(),
          user: {
            id: `temp-${value}`,
            username: value,
            displayName: value,
            avatarUrl: null,
          },
        },
      ])
      setUsername('')
    })
  }

  const handleRemove = (userId: string) => {
    if (userId.startsWith('temp-')) {
      setMembers((prev) => prev.filter((m) => m.userId !== userId))
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await removeForumRole({ spaceId: space.id, userId })
      if (!result.ok) {
        setError(result.error ?? 'Error')
        return
      }
      setMembers((prev) => prev.filter((m) => m.userId !== userId))
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}

      <form
        onSubmit={handleAdd}
        className="flex flex-wrap gap-2 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="@username"
          className="min-w-40 flex-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as ForoRoleType)}
          className="min-w-35 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        >
          <option value="moderator">Moderador</option>
          <option value="admin">Administrador</option>
        </select>
        <button
          type="submit"
          disabled={isPending || !username.trim()}
          className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
        >
          Añadir
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-120 text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
              <th className="px-4 py-2">Usuario</th>
              <th className="px-4 py-2">Rol</th>
              <th className="px-4 py-2">Añadido</th>
              <th className="px-4 py-2 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                  Sin moderadores todavía.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr
                  key={`${m.userId}-${m.role}`}
                  className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                      {m.user.displayName}
                    </div>
                    <div className="text-xs text-neutral-500">@{m.user.username}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 capitalize dark:text-neutral-300">
                    {m.role === 'admin' ? 'Administrador' : 'Moderador'}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {formatRelativeDate(m.grantedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(m.userId)}
                      className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-900/20"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
