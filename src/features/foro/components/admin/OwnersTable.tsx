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
  community: 'Comunidad',
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
    <section className="min-w-0 rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <header className="flex flex-col gap-4 border-b border-neutral-200 px-5 py-4 md:flex-row md:items-center md:justify-between dark:border-neutral-800">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Perfiles
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {filtered.length} de {candidates.length}{' '}
            {candidates.length === 1 ? 'perfil' : 'perfiles'}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | OwnerType)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none sm:w-auto dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          >
            <option value="all">Todos los tipos</option>
            <option value="club">Clubs</option>
            <option value="group">Grupos</option>
            <option value="page">Páginas</option>
            <option value="blog">Blogs</option>
            <option value="profile">Perfiles</option>
            <option value="portal">Portal</option>
          </select>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o slug…"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none sm:w-56 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </div>
      </header>

      {error && (
        <p className="border-b border-red-200 bg-red-50 px-5 py-2.5 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/60 text-left text-[11px] font-semibold tracking-wider text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400">
              <th className="px-5 py-3">Nombre</th>
              <th className="hidden px-4 py-3 md:table-cell">Tipo</th>
              <th className="hidden px-4 py-3 lg:table-cell">Slug</th>
              <th className="hidden px-4 py-3 lg:table-cell">Privacidad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-neutral-500">
                  Sin resultados.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const enabled = c.hasSpace && c.spaceEnabled
                return (
                  <tr
                    key={`${c.ownerType}:${c.ownerId}`}
                    className="border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50/60 dark:border-neutral-800 dark:hover:bg-neutral-800/40"
                  >
                    <td className="px-5 py-4 align-middle">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">
                        {c.name}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500 md:hidden">
                        <span>{TYPE_LABELS[c.ownerType]}</span>
                        {c.slug && <span className="truncate">· {c.slug}</span>}
                      </div>
                    </td>
                    <td className="hidden px-4 py-4 align-middle text-neutral-600 md:table-cell dark:text-neutral-300">
                      {TYPE_LABELS[c.ownerType]}
                    </td>
                    <td className="hidden max-w-[220px] px-4 py-4 align-middle text-neutral-500 lg:table-cell">
                      <span className="block truncate">{c.slug ?? '—'}</span>
                    </td>
                    <td className="hidden px-4 py-4 align-middle text-neutral-500 lg:table-cell">
                      {c.privacy}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      {enabled ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-green-700 uppercase dark:bg-green-900/30 dark:text-green-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          Habilitado
                        </span>
                      ) : c.hasSpace ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-amber-800 uppercase dark:bg-amber-900/30 dark:text-amber-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Inactivo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-neutral-600 uppercase dark:bg-neutral-800 dark:text-neutral-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                          Sin foro
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right align-middle whitespace-nowrap">
                      {!c.hasSpace && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleEnable(c)}
                          className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-500 disabled:opacity-50"
                        >
                          Habilitar
                        </button>
                      )}
                      {c.hasSpace && c.spaceSlug && (
                        <div className="inline-flex flex-wrap justify-end gap-2">
                          <Link
                            href={`/foro/${c.spaceSlug}/admin` as Route}
                            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                          >
                            Administrar
                          </Link>
                          {enabled ? (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleDisable(c)}
                              className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-900/20"
                            >
                              Deshabilitar
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleEnable(c)}
                              className="rounded-lg border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-50 disabled:opacity-50 dark:border-green-900/60 dark:text-green-300 dark:hover:bg-green-900/20"
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
