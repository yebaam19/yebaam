'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('foro.admin.topics')
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
        if (!res.ok && !firstError) firstError = res.error ?? t('bulk.actionFailed', { key, id })
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
    if (!confirm(t('bulk.deleteConfirm', { count: selected.size }))) return
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
          placeholder={t('filters.searchPlaceholder')}
          className="min-w-45 flex-1 basis-48 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        />
        <select
          value={draft.space}
          onChange={(e) => setDraft({ ...draft, space: e.target.value, forum: '' })}
          className="min-w-40 flex-1 basis-40 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        >
          <option value="">{t('filters.allSpaces')}</option>
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
          <option value="">{t('filters.allForums')}</option>
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
          placeholder={t('filters.authorPlaceholder')}
          className="min-w-35 flex-1 basis-36 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        />
        <select
          value={draft.pinned}
          onChange={(e) => setDraft({ ...draft, pinned: e.target.value })}
          className="min-w-35 flex-1 basis-36 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        >
          <option value="">{t('filters.pinnedAny')}</option>
          <option value="true">{t('filters.pinnedOnly')}</option>
          <option value="false">{t('filters.pinnedNone')}</option>
        </select>
        <select
          value={draft.locked}
          onChange={(e) => setDraft({ ...draft, locked: e.target.value })}
          className="min-w-35 flex-1 basis-36 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-xs dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        >
          <option value="">{t('filters.statusAny')}</option>
          <option value="true">{t('filters.lockedOnly')}</option>
          <option value="false">{t('filters.openOnly')}</option>
        </select>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <Button type="button" plain onClick={clearFilters}>
            {t('filters.clear')}
          </Button>
          <Button type="submit" color="primary">
            {t('filters.apply')}
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
          {t('summary.found', { count: initial.total })}
          {selected.size > 0 && (
            <>
              {' · '}
              {t('summary.selected', { count: selected.size })}
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
            {t('bulk.title', { count: selected.size })}
          </span>
          <Button
            type="button"
            outline
            disabled={pendingAction !== null}
            onClick={() => handlePin(true)}
          >
            {t('bulk.pin')}
          </Button>
          <Button
            type="button"
            outline
            disabled={pendingAction !== null}
            onClick={() => handlePin(false)}
          >
            {t('bulk.unpin')}
          </Button>
          <Button
            type="button"
            outline
            disabled={pendingAction !== null}
            onClick={() => handleLock(true)}
          >
            {t('bulk.lock')}
          </Button>
          <Button
            type="button"
            outline
            disabled={pendingAction !== null}
            onClick={() => handleLock(false)}
          >
            {t('bulk.unlock')}
          </Button>
          <div className="flex items-center gap-1">
            <select
              value={moveTarget}
              onChange={(e) => setMoveTarget(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            >
              <option value="">{t('bulk.movePlaceholder')}</option>
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
              {t('bulk.move')}
            </Button>
          </div>
          <Button
            type="button"
            color="red"
            disabled={pendingAction !== null}
            onClick={handleDelete}
          >
            {t('bulk.delete')}
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
                  aria-label={t('table.selectAllAria')}
                  checked={allOnPageSelected}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-3 py-2 text-left">{t('table.topic')}</th>
              <th className="px-3 py-2 text-left">{t('table.spaceForum')}</th>
              <th className="px-3 py-2 text-center">{t('table.replies')}</th>
              <th className="px-3 py-2 text-center">{t('table.views')}</th>
              <th className="px-3 py-2 text-right">{t('table.lastPost')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {topics.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-neutral-500">
                  {t('table.empty')}
                </td>
              </tr>
            ) : (
              topics.map((tp) => {
                const replies = Math.max(tp.postCount - 1, 0)
                const isSel = selected.has(tp.id)
                return (
                  <tr
                    key={tp.id}
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
                        aria-label={t('table.selectAria', { title: tp.title })}
                        checked={isSel}
                        onChange={() => toggleOne(tp.id)}
                      />
                    </td>
                    <td className="min-w-0 px-3 py-3 align-top">
                      <div className="flex items-start gap-2">
                        <UserAvatar author={tp.author} className="h-7 w-7 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1">
                            {tp.isPinned && <Badge color="amber">{t('table.pinned')}</Badge>}
                            {tp.isLocked && <Badge color="zinc">{t('table.locked')}</Badge>}
                            <Link
                              href={
                                `/foro/${tp.spaceSlug}/${tp.forumSlug}/${tp.slug}` as Route
                              }
                              className="truncate text-sm font-semibold text-neutral-900 hover:text-primary-700 dark:text-neutral-100 dark:hover:text-primary-400"
                            >
                              {tp.title}
                            </Link>
                          </div>
                          <div className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                            {t('table.byAuthor')}{' '}
                            <span className="font-medium text-neutral-700 dark:text-neutral-300">
                              {tp.author.displayName}
                            </span>{' '}
                            · {formatRelativeDate(tp.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top text-xs">
                      <Link
                        href={`/foro/${tp.spaceSlug}` as Route}
                        className="block truncate font-medium text-neutral-700 hover:text-primary-700 dark:text-neutral-300 dark:hover:text-primary-400"
                      >
                        {tp.spaceName}
                      </Link>
                      <Link
                        href={`/foro/${tp.spaceSlug}/${tp.forumSlug}` as Route}
                        className="block truncate text-neutral-500 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-400"
                      >
                        {tp.forumName}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-center align-top text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {replies}
                    </td>
                    <td className="px-3 py-3 text-center align-top text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {tp.viewCount}
                    </td>
                    <td className="px-3 py-3 text-right align-top text-xs text-neutral-500 dark:text-neutral-400">
                      {tp.lastPostAt ? (
                        <>
                          {tp.lastPostAuthor && (
                            <div className="truncate font-medium text-neutral-700 dark:text-neutral-300">
                              {tp.lastPostAuthor.displayName}
                            </div>
                          )}
                          <div>{formatRelativeDate(tp.lastPostAt)}</div>
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
          {t('status.applying', { action: pendingAction })}
        </div>
      )}
      {/* avoids "totalShownPage assigned but never used" if unused later */}
      <span hidden>{totalShownPage}</span>
    </div>
  )
}
