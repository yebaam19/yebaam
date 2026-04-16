'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import clsx from 'clsx'
import {
  deleteTopic,
  moveTopic,
  setTopicLocked,
  setTopicPinned,
} from '@/features/foro/actions/foro.actions'
import type {
  AdminFilterOption,
  AdminForumOption,
  ForoTopicAdminRow,
} from '@/app/(app)/foro/server/admin.server'
import { Badge } from '@/ui/Badge'
import { Button } from '@/ui/Button'
import UserAvatar from '@/features/foro/components/UserAvatar'
import ForoPagination from '@/features/foro/components/Pagination'
import { formatRelativeDate } from '@/features/foro/utils/format'

interface Props {
  initial: {
    topics: ForoTopicAdminRow[]
    total: number
    page: number
    pageSize: number
  }
  spaces: AdminFilterOption[]
  forums: AdminForumOption[]
}

type ActionKey = 'pin' | 'unpin' | 'lock' | 'unlock' | 'move' | 'delete'

export default function TopicsAdminTable({ initial, spaces, forums }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pendingAction, setPendingAction] = useState<ActionKey | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [moveTarget, setMoveTarget] = useState('')

  const topics = initial.topics

  const currentSearch = searchParams?.get('q') ?? ''
  const currentSpaceId = searchParams?.get('space') ?? ''
  const currentForumId = searchParams?.get('forum') ?? ''
  const currentAuthor = searchParams?.get('author') ?? ''
  const currentPinned = searchParams?.get('pinned') ?? ''
  const currentLocked = searchParams?.get('locked') ?? ''

  const [draft, setDraft] = useState({
    q: currentSearch,
    space: currentSpaceId,
    forum: currentForumId,
    author: currentAuthor,
    pinned: currentPinned,
    locked: currentLocked,
  })

  const filteredForums = useMemo(
    () => (draft.space ? forums.filter((f) => f.spaceId === draft.space) : forums),
    [forums, draft.space],
  )

  const submitFilters = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (draft.q.trim()) params.set('q', draft.q.trim())
    if (draft.space) params.set('space', draft.space)
    if (draft.forum) params.set('forum', draft.forum)
    if (draft.author.trim()) params.set('author', draft.author.trim())
    if (draft.pinned) params.set('pinned', draft.pinned)
    if (draft.locked) params.set('locked', draft.locked)
    const qs = params.toString()
    router.push((qs ? `/admin/foros/temas?${qs}` : '/admin/foros/temas') as Route)
  }

  const clearFilters = () => {
    setDraft({ q: '', space: '', forum: '', author: '', pinned: '', locked: '' })
    router.push('/admin/foros/temas' as Route)
  }

  const allOnPageSelected = topics.length > 0 && topics.every((t) => selected.has(t.id))
  const toggleAll = () => {
    if (allOnPageSelected) {
      const next = new Set(selected)
      for (const t of topics) next.delete(t.id)
      setSelected(next)
    } else {
      const next = new Set(selected)
      for (const t of topics) next.add(t.id)
      setSelected(next)
    }
  }
  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const runBulk = (key: ActionKey, runner: (id: string) => Promise<{ ok: boolean; error?: string }>) => {
    setPendingAction(key)
    setError(null)
    startTransition(async () => {
      const ids = Array.from(selected)
      let firstError: string | null = null
      for (const id of ids) {
        const res = await runner(id)
        if (!res.ok && !firstError) firstError = res.error ?? `Acción "${key}" falló para ${id}`
      }
      setPendingAction(null)
      setSelected(new Set())
      if (firstError) setError(firstError)
      router.refresh()
    })
  }

  const handlePin = (pinned: boolean) =>
    runBulk(pinned ? 'pin' : 'unpin', (id) => setTopicPinned(id, pinned))
  const handleLock = (locked: boolean) =>
    runBulk(locked ? 'lock' : 'unlock', (id) => setTopicLocked(id, locked))
  const handleDelete = () => {
    if (!confirm(`¿Eliminar ${selected.size} tema(s) y todos sus mensajes?`)) return
    runBulk('delete', (id) => deleteTopic(id))
  }
  const handleMove = () => {
    if (!moveTarget) return
    runBulk('move', (id) =>
      moveTopic(id, moveTarget).then((r) => ({ ok: r.ok, error: r.error })),
    )
    setMoveTarget('')
  }

  const totalShownPage = Math.ceil(initial.total / initial.pageSize) || 1
  const buildHref = (p: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (p === 1) params.delete('page')
    else params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/admin/foros/temas?${qs}` : '/admin/foros/temas'
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={submitFilters}
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <input
          type="search"
          value={draft.q}
          onChange={(e) => setDraft({ ...draft, q: e.target.value })}
          placeholder="Buscar por título…"
          className="min-w-45 flex-1 basis-48 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        />
        <select
          value={draft.space}
          onChange={(e) => setDraft({ ...draft, space: e.target.value, forum: '' })}
          className="min-w-40 flex-1 basis-40 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        >
          <option value="">Todos los espacios</option>
          {spaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={draft.forum}
          onChange={(e) => setDraft({ ...draft, forum: e.target.value })}
          className="min-w-40 flex-1 basis-40 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        >
          <option value="">Todos los foros</option>
          {filteredForums.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={draft.author}
          onChange={(e) => setDraft({ ...draft, author: e.target.value })}
          placeholder="Autor (username)"
          className="min-w-35 flex-1 basis-36 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        />
        <select
          value={draft.pinned}
          onChange={(e) => setDraft({ ...draft, pinned: e.target.value })}
          className="min-w-35 flex-1 basis-36 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        >
          <option value="">Fijado: cualquiera</option>
          <option value="true">Solo fijados</option>
          <option value="false">Sin fijar</option>
        </select>
        <select
          value={draft.locked}
          onChange={(e) => setDraft({ ...draft, locked: e.target.value })}
          className="min-w-35 flex-1 basis-36 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        >
          <option value="">Estado: cualquiera</option>
          <option value="true">Solo cerrados</option>
          <option value="false">Solo abiertos</option>
        </select>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <Button type="button" plain onClick={clearFilters}>
            Limpiar
          </Button>
          <Button type="submit" color="primary">
            Aplicar filtros
          </Button>
        </div>
      </form>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          <strong className="text-neutral-900 dark:text-neutral-100">{initial.total}</strong>{' '}
          {initial.total === 1 ? 'tema' : 'temas'} encontrados
          {selected.size > 0 && (
            <>
              {' · '}
              <strong className="text-primary-700 dark:text-primary-400">
                {selected.size}
              </strong>{' '}
              seleccionado(s)
            </>
          )}
        </div>
        <ForoPagination
          page={initial.page}
          pageSize={initial.pageSize}
          total={initial.total}
          buildHref={buildHref}
        />
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary-200 bg-primary-50/60 p-3 dark:border-primary-800 dark:bg-primary-900/20">
          <span className="text-xs font-semibold text-primary-800 dark:text-primary-300">
            Acciones en lote ({selected.size}):
          </span>
          <Button
            type="button"
            outline
            disabled={pendingAction !== null}
            onClick={() => handlePin(true)}
          >
            Fijar
          </Button>
          <Button
            type="button"
            outline
            disabled={pendingAction !== null}
            onClick={() => handlePin(false)}
          >
            Quitar fijado
          </Button>
          <Button
            type="button"
            outline
            disabled={pendingAction !== null}
            onClick={() => handleLock(true)}
          >
            Cerrar
          </Button>
          <Button
            type="button"
            outline
            disabled={pendingAction !== null}
            onClick={() => handleLock(false)}
          >
            Reabrir
          </Button>
          <div className="flex items-center gap-1">
            <select
              value={moveTarget}
              onChange={(e) => setMoveTarget(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            >
              <option value="">Mover a foro…</option>
              {forums.map((f) => {
                const space = spaces.find((s) => s.id === f.spaceId)
                return (
                  <option key={f.id} value={f.id}>
                    {space?.name ?? '—'} / {f.name}
                  </option>
                )
              })}
            </select>
            <Button
              type="button"
              outline
              disabled={!moveTarget || pendingAction !== null}
              onClick={handleMove}
            >
              Mover
            </Button>
          </div>
          <Button
            type="button"
            color="red"
            disabled={pendingAction !== null}
            onClick={handleDelete}
          >
            Eliminar
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
          <thead className="bg-neutral-50 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase dark:bg-neutral-900/60 dark:text-neutral-400">
            <tr>
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  aria-label="Seleccionar todos en página"
                  checked={allOnPageSelected}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-3 py-2 text-left">Tema</th>
              <th className="px-3 py-2 text-left">Espacio / Foro</th>
              <th className="px-3 py-2 text-center">Resp.</th>
              <th className="px-3 py-2 text-center">Vistas</th>
              <th className="px-3 py-2 text-right">Último mensaje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {topics.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-neutral-500">
                  No hay temas que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              topics.map((t) => {
                const replies = Math.max(t.postCount - 1, 0)
                const isSel = selected.has(t.id)
                return (
                  <tr
                    key={t.id}
                    className={clsx(
                      'transition-colors',
                      isSel
                        ? 'bg-primary-50/60 dark:bg-primary-900/20'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40',
                    )}
                  >
                    <td className="px-3 py-3 align-top">
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar ${t.title}`}
                        checked={isSel}
                        onChange={() => toggleOne(t.id)}
                      />
                    </td>
                    <td className="min-w-0 px-3 py-3 align-top">
                      <div className="flex items-start gap-2">
                        <UserAvatar author={t.author} className="h-7 w-7 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1">
                            {t.isPinned && <Badge color="amber">Fijado</Badge>}
                            {t.isLocked && <Badge color="zinc">Cerrado</Badge>}
                            <Link
                              href={
                                `/foro/${t.spaceSlug}/${t.forumSlug}/${t.slug}` as Route
                              }
                              className="truncate text-sm font-semibold text-neutral-900 hover:text-primary-700 dark:text-neutral-100 dark:hover:text-primary-400"
                            >
                              {t.title}
                            </Link>
                          </div>
                          <div className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                            por{' '}
                            <span className="font-medium text-neutral-700 dark:text-neutral-300">
                              {t.author.displayName}
                            </span>{' '}
                            · {formatRelativeDate(t.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top text-xs">
                      <Link
                        href={`/foro/${t.spaceSlug}` as Route}
                        className="block truncate font-medium text-neutral-700 hover:text-primary-700 dark:text-neutral-300 dark:hover:text-primary-400"
                      >
                        {t.spaceName}
                      </Link>
                      <Link
                        href={`/foro/${t.spaceSlug}/${t.forumSlug}` as Route}
                        className="block truncate text-neutral-500 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-400"
                      >
                        {t.forumName}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-center align-top text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {replies}
                    </td>
                    <td className="px-3 py-3 text-center align-top text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {t.viewCount}
                    </td>
                    <td className="px-3 py-3 text-right align-top text-xs text-neutral-500 dark:text-neutral-400">
                      {t.lastPostAt ? (
                        <>
                          {t.lastPostAuthor && (
                            <div className="truncate font-medium text-neutral-700 dark:text-neutral-300">
                              {t.lastPostAuthor.displayName}
                            </div>
                          )}
                          <div>{formatRelativeDate(t.lastPostAt)}</div>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <ForoPagination
          page={initial.page}
          pageSize={initial.pageSize}
          total={initial.total}
          buildHref={buildHref}
        />
      </div>

      {/* tiny status bar */}
      {pendingAction && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-primary-300 bg-white px-4 py-1.5 text-xs font-medium text-primary-800 shadow-lg dark:border-primary-700 dark:bg-neutral-900 dark:text-primary-300">
          Aplicando «{pendingAction}»…
        </div>
      )}
      {/* avoids "totalShownPage assigned but never used" if unused later */}
      <span hidden>{totalShownPage}</span>
    </div>
  )
}
