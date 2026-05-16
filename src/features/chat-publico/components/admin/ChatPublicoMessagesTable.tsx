'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Route } from 'next'
import clsx from 'clsx'
import { useLocale, useTranslations } from 'next-intl'
import Avatar from '@/ui/Avatar'
import { Badge } from '@/ui/Badge'
import { Button } from '@/ui/Button'
import ForoPagination from '@/features/foro/components/Pagination'
import type {
  PublicChatTopic,
  PublicMessageSender,
  PublicMessageWithSender,
} from '@/features/chat-publico/types'
import {
  adminRestoreMessage,
  adminSoftDeleteMessage,
} from '@/features/chat-publico/actions/admin.actions'

interface Props {
  initial: {
    messages: PublicMessageWithSender[]
    topicNameById: Record<string, string>
    total: number
    page: number
    pageSize: number
  }
  topics: PublicChatTopic[]
}

function senderLabel(sender: PublicMessageSender | null | undefined, fallback: string) {
  if (!sender) return fallback
  return sender.display_name || sender.username || fallback
}

function senderInitials(sender: PublicMessageSender | null | undefined, fallback: string) {
  const label = senderLabel(sender, fallback)
  const parts = label.split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] ?? 'U').concat(parts[1]?.[0] ?? '').toUpperCase().slice(0, 2)
}

function formatFullDate(iso: string, locale: string) {
  const d = new Date(iso)
  return d.toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ChatPublicoMessagesTable({ initial, topics }: Props) {
  const t = useTranslations('admin.chatPublicoTable')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const currentSearch = searchParams?.get('q') ?? ''
  const currentTopic = searchParams?.get('topic') ?? ''
  const currentDeleted = searchParams?.get('deleted') ?? ''

  const [draft, setDraft] = useState({
    q: currentSearch,
    topic: currentTopic,
    deleted: currentDeleted,
  })

  const submitFilters = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (draft.q.trim()) params.set('q', draft.q.trim())
    if (draft.topic) params.set('topic', draft.topic)
    if (draft.deleted) params.set('deleted', draft.deleted)
    const qs = params.toString()
    router.push((qs ? `/admin/chat-publico?${qs}` : '/admin/chat-publico') as Route)
  }

  const clearFilters = () => {
    setDraft({ q: '', topic: '', deleted: '' })
    router.push('/admin/chat-publico' as Route)
  }

  const run = (id: string, runner: (id: string) => Promise<{ ok: boolean; error?: string }>) => {
    setPendingId(id)
    setError(null)
    startTransition(async () => {
      const res = await runner(id)
      setPendingId(null)
      if (!res.ok) {
        setError(res.error ?? t('errorFallback'))
      }
      router.refresh()
    })
  }

  const buildHref = (p: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (p === 1) params.delete('page')
    else params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/admin/chat-publico?${qs}` : '/admin/chat-publico'
  }

  const topicOptions = topics

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
          placeholder={t('searchPlaceholder')}
          className="min-w-45 flex-1 basis-48 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        />
        <select
          value={draft.topic}
          onChange={(e) => setDraft({ ...draft, topic: e.target.value })}
          className="min-w-40 flex-1 basis-40 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        >
          <option value="">{t('filterAllChannels')}</option>
          {topicOptions.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
              {topic.is_archived ? t('filterArchivedSuffix') : ''}
            </option>
          ))}
        </select>
        <select
          value={draft.deleted}
          onChange={(e) => setDraft({ ...draft, deleted: e.target.value })}
          className="min-w-40 flex-1 basis-40 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        >
          <option value="">{t('filterAnyStatus')}</option>
          <option value="false">{t('filterOnlyVisible')}</option>
          <option value="true">{t('filterOnlyDeleted')}</option>
        </select>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <Button type="button" plain onClick={clearFilters}>
            {t('clear')}
          </Button>
          <Button type="submit" color="primary">
            {t('applyFilters')}
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
          {t('countMessages', { count: initial.total })} {t('messagesFound')}
        </div>
        <ForoPagination
          page={initial.page}
          pageSize={initial.pageSize}
          total={initial.total}
          buildHref={buildHref}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
            <thead className="bg-neutral-50 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase dark:bg-neutral-900/60 dark:text-neutral-400">
              <tr>
                <th className="px-3 py-2 text-left">{t('columnAuthor')}</th>
                <th className="px-3 py-2 text-left">{t('columnMessage')}</th>
                <th className="px-3 py-2 text-left">{t('columnChannel')}</th>
                <th className="px-3 py-2 text-right">{t('columnSent')}</th>
                <th className="px-3 py-2 text-right">{t('columnActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {initial.messages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-neutral-500">
                    {t('emptyResults')}
                  </td>
                </tr>
              ) : (
                initial.messages.map((m) => {
                  const userFallback = t('userFallback')
                  const label = senderLabel(m.sender, userFallback)
                  const topicName = initial.topicNameById[m.topic_id] ?? '—'
                  const isPending = pendingId === m.id
                  return (
                    <tr
                      key={m.id}
                      className={clsx(
                        'transition-colors',
                        m.is_deleted
                          ? 'bg-red-50/40 dark:bg-red-950/10'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40',
                      )}
                    >
                      <td className="min-w-40 px-3 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={m.sender?.avatar_url ?? undefined}
                            alt={label}
                            initials={senderInitials(m.sender, userFallback)}
                            className="h-8 w-8 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              {label}
                            </div>
                            {m.sender?.username && (
                              <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                                @{m.sender.username}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="max-w-sm min-w-0 px-3 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          {m.is_deleted && (
                            <Badge color="red" className="w-fit">
                              {t('deletedBadge')}
                            </Badge>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words text-neutral-800 dark:text-neutral-200">
                            {m.content}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top text-xs text-neutral-600 dark:text-neutral-400">
                        {topicName}
                      </td>
                      <td className="px-3 py-3 text-right align-top text-xs text-neutral-500 dark:text-neutral-400">
                        {formatFullDate(m.created_at, locale)}
                      </td>
                      <td className="px-3 py-3 text-right align-top">
                        {m.is_deleted ? (
                          <Button
                            type="button"
                            outline
                            disabled={isPending}
                            onClick={() => run(m.id, adminRestoreMessage)}
                          >
                            {isPending ? t('restoring') : t('restore')}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            color="red"
                            disabled={isPending}
                            onClick={() => {
                              if (!confirm(t('confirmDelete'))) return
                              run(m.id, adminSoftDeleteMessage)
                            }}
                          >
                            {isPending ? t('deleting') : t('delete')}
                          </Button>
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

      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        {t('viewLiveChat')}{' '}
        <Link
          href={'/feed/chat-publico' as Route}
          className="text-primary-700 hover:underline dark:text-primary-400"
        >
          /feed/chat-publico
        </Link>
      </p>
    </div>
  )
}
