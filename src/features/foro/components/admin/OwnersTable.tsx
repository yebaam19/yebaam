'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import {
  disableForumSpaceBySlug,
  enableForumForOwner,
} from '@/features/foro/actions/admin.actions'
import type { OwnerCandidate, OwnerType } from '@/features/foro/types'

interface Props {
  initial: OwnerCandidate[]
}

const TYPE_LABELS: Record<OwnerType, string> = {
  club: 'Club',
  group: 'Grupo',
  blog: 'Blog',
  page: 'Página',
  city: 'Ciudad',
  profile: 'Perfil',
  portal: 'Portal',
}

export default function OwnersTable({ initial }: Props) {
  const [candidates, setCandidates] = useState(initial)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | OwnerType>('all')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return candidates.filter((c) => {
      if (typeFilter !== 'all' && c.ownerType !== typeFilter) return false
      if (!q) return true
      return c.name.toLowerCase().includes(q) || (c.slug ?? '').toLowerCase().includes(q)
    })
  }, [candidates, query, typeFilter])

  const handleEnable = (c: OwnerCandidate) => {
    setError(null)
    startTransition(async () => {
      const result = await enableForumForOwner({
        ownerType: c.ownerType,
        ownerId: c.ownerId,
      })
      if (!result.ok) {
        setError(result.error ?? 'No se pudo habilitar.')
        return
      }
      setCandidates((prev) =>
        prev.map((row) =>
          row.ownerType === c.ownerType && row.ownerId === c.ownerId
            ? {
                ...row,
                hasSpace: true,
                spaceSlug: result.spaceSlug ?? row.spaceSlug,
                spaceEnabled: true,
              }
            : row,
        ),
      )
    })
  }

  const handleDisable = (c: OwnerCandidate) => {
    if (!c.spaceSlug) return
    setError(null)
    startTransition(async () => {
      const result = await disableForumSpaceBySlug(c.spaceSlug!)
      if (!result.ok) {
        setError(result.error ?? 'No se pudo deshabilitar.')
        return
      }
      setCandidates((prev) =>
        prev.map((row) =>
          row.ownerType === c.ownerType && row.ownerId === c.ownerId
            ? { ...row, spaceEnabled: false }
            : row,
        ),
      )
    })
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <header className="flex flex-wrap items-center gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Perfiles
        </h2>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | OwnerType)}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          >
            <option value="all">Todos los tipos</option>
            <option value="club">Clubs</option>
            <option value="group">Grupos</option>
            <option value="page">Páginas</option>
            <option value="blog">Blogs</option>
          </select>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o slug"
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          />
        </div>
      </header>

      {error && (
        <p className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Privacidad</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  Sin resultados.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const enabled = c.hasSpace && c.spaceEnabled
                return (
                  <tr
                    key={`${c.ownerType}:${c.ownerId}`}
                    className="border-b border-neutral-100 last:border-0 dark:border-neutral-800"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                      {TYPE_LABELS[c.ownerType]}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{c.slug ?? '—'}</td>
                    <td className="px-4 py-3 text-neutral-500">{c.privacy}</td>
                    <td className="px-4 py-3">
                      {enabled ? (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-green-700 uppercase dark:bg-green-900/40 dark:text-green-300">
                          Habilitado
                        </span>
                      ) : c.hasSpace ? (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase dark:bg-amber-900/40 dark:text-amber-300">
                          Inactivo
                        </span>
                      ) : (
                        <span className="rounded bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-neutral-600 uppercase dark:bg-neutral-800 dark:text-neutral-400">
                          Sin foro
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!c.hasSpace && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleEnable(c)}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                        >
                          Habilitar foro
                        </button>
                      )}
                      {c.hasSpace && c.spaceSlug && (
                        <div className="inline-flex gap-2">
                          <Link
                            href={`/foro/${c.spaceSlug}/admin` as Route}
                            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                          >
                            Administrar
                          </Link>
                          {enabled ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleDisable(c)}
                              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-900/20"
                            >
                              Deshabilitar
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleEnable(c)}
                              className="rounded-md border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 dark:border-green-900/60 dark:text-green-300 dark:hover:bg-green-900/20"
                            >
                              Reactivar
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
