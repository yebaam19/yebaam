'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Route } from 'next'
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
import ForoPagination from '@/features/foro/components/Pagination'
import TopicFilters from './TopicsAdminTable/TopicFilters'
import BulkActionsBar from './TopicsAdminTable/BulkActionsBar'
import TopicsTable from './TopicsAdminTable/TopicsTable'

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

  const [draft, setDraft] = useState({
    q: searchParams?.get('q') ?? '',
    space: searchParams?.get('space') ?? '',
    forum: searchParams?.get('forum') ?? '',
    author: searchParams?.get('author') ?? '',
    pinned: searchParams?.get('pinned') ?? '',
    locked: searchParams?.get('locked') ?? '',
  })

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
  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

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

  const buildHref = (p: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (p === 1) params.delete('page')
    else params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/admin/foros/temas?${qs}` : '/admin/foros/temas'
  }

  return (
    <div className="space-y-4">
      <TopicFilters
        draft={draft}
        spaces={spaces}
        forums={forums}
        onChange={setDraft}
        onSubmit={submitFilters}
        onClear={clearFilters}
      />

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
        <BulkActionsBar
          selectedCount={selected.size}
          spaces={spaces}
          forums={forums}
          pending={pendingAction !== null}
          moveTarget={moveTarget}
          onMoveTargetChange={setMoveTarget}
          onPin={handlePin}
          onLock={handleLock}
          onMove={handleMove}
          onDelete={handleDelete}
        />
      )}

      <TopicsTable
        topics={topics}
        selected={selected}
        allOnPageSelected={allOnPageSelected}
        onToggleAll={toggleAll}
        onToggleOne={toggleOne}
      />

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
    </div>
  )
}
