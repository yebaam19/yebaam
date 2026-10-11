'use client'

import {
adminRestoreMessage,
adminSoftDeleteMessage,
} from '@/features/chat-publico/actions/admin.actions'
import type {
PublicMessageSender,
PublicMessageWithSender
} from '@/features/chat-publico/types'
import Avatar from '@/ui/Avatar'
import { Badge } from '@/ui/Badge'
import { Button } from '@/ui/Button'
import clsx from 'clsx'
import { useLocale,useTranslations } from 'next-intl'

interface RowProps {
  initial: { messages: PublicMessageWithSender[]; topicNameById: Record<string, string> }
  pendingId: string | null
  run: (id: string, runner: (id: string) => Promise<{ ok: boolean; error?: string }>) => void
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

export function ChatPublicoMessageRows({ initial, pendingId, run }: RowProps) {
  const t = useTranslations('admin.chatPublicoTable')
  const locale = useLocale()
  return (
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
  )
}
