'use client'

import type { RefObject } from 'react'
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import Avatar from '@/ui/Avatar'
import { cn } from '@/lib/utils'
import type { ClientChatIdentity, PublicMessageWithSender, ResolvedMessageAuthor } from '../types'

interface Props {
  messages: PublicMessageWithSender[]
  identity: ClientChatIdentity | null
  locallySent: Set<string>
  listRef: RefObject<HTMLDivElement | null>
  hasMore: boolean
  isLoadingOlder: boolean
  onScroll: () => void
  onLoadOlder: () => void
  onDelete: (id: string) => void
  onReply: (message: PublicMessageWithSender) => void
}

function resolveAuthor(message: PublicMessageWithSender, fallbackUser: string, fallbackGuest: string): ResolvedMessageAuthor {
  const kind = (message.sender_kind as ResolvedMessageAuthor['kind']) || 'profile'
  if (kind === 'profile' || kind === 'nick') {
    return {
      label: message.sender?.display_name || message.sender?.username || message.sender_nickname || fallbackUser,
      avatarUrl: message.sender?.avatar_url ?? message.sender_avatar_url ?? null,
      kind,
      userId: message.sender_id ?? null,
    }
  }
  return { label: message.sender_nickname || fallbackGuest, avatarUrl: null, kind: 'guest', userId: null }
}

function authorInitials(label: string) {
  const parts = label.split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] ?? 'U').concat(parts[1]?.[0] ?? '').toUpperCase().slice(0, 2)
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatMessageList({ messages, identity, locallySent, listRef, hasMore, isLoadingOlder, onScroll, onLoadOlder, onDelete, onReply }: Props) {
  const t = useTranslations('chat.public.view')
  const parentById = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages])

  return (
    <div ref={listRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6">
      {hasMore && (
        <div className="mb-4 flex justify-center">
          <button type="button" onClick={onLoadOlder} disabled={isLoadingOlder}
            className="rounded-full border border-primary-100 bg-white px-3 py-1 text-xs text-primary-700 hover:bg-primary-50 disabled:opacity-50 dark:border-primary-900 dark:bg-neutral-900 dark:text-primary-300">
            {isLoadingOlder ? t('loading') : t('loadOlder')}
          </button>
        </div>
      )}
      {messages.length === 0 && <p className="flex h-full items-center justify-center text-center text-sm text-neutral-500">{t('emptyState')}</p>}
      <ul className="flex flex-col gap-2">
        {messages.map((message, index) => {
          const previous = messages[index - 1]
          const grouped = !!previous && previous.sender_id === message.sender_id && previous.sender_nickname === message.sender_nickname && previous.sender_kind === message.sender_kind && new Date(message.created_at).getTime() - new Date(previous.created_at).getTime() < 60_000
          const author = resolveAuthor(message, t('fallbackUser'), t('fallbackGuest'))
          const isOwn = !!identity && ((identity.kind !== 'guest' && message.sender_id === identity.userId) || locallySent.has(message.id))
          const parent = message.parent_message_id ? parentById.get(message.parent_message_id) : null
          const parentAuthor = parent ? resolveAuthor(parent, t('fallbackUser'), t('fallbackGuest')) : null
          return (
            <li key={message.id} className={cn('flex items-end gap-2', isOwn && 'flex-row-reverse')}>
              <div className="w-8 shrink-0">
                {!grouped && !isOwn && <Avatar src={author.avatarUrl ?? undefined} alt={author.label} initials={authorInitials(author.label)} className="h-8 w-8" />}
              </div>
              <div className={cn('flex max-w-[85%] min-w-0 flex-col gap-0.5 sm:max-w-[75%]', isOwn && 'items-end')}>
                {!grouped && !isOwn && (
                  <span className="flex items-center gap-1.5 px-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {author.label}
                    {(author.kind === 'guest' || author.kind === 'nick') && (
                      <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[9px] font-medium uppercase text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                        {t(author.kind === 'guest' ? 'badgeGuest' : 'badgeNick')}
                      </span>
                    )}
                  </span>
                )}
                <div className={cn('rounded-2xl px-3 py-2 text-sm break-words', message.is_deleted ? 'bg-neutral-100 text-neutral-400' : isOwn ? 'bg-primary-700 text-white' : 'bg-primary-50 text-primary-950 dark:bg-primary-950/40 dark:text-primary-100')}>
                  {message.parent_message_id && (
                    <div className={cn('mb-1.5 border-l-2 py-0.5 pl-2 text-xs', isOwn ? 'border-white/50 text-white/80' : 'border-primary-400 text-primary-700 dark:text-primary-300')}>
                      <span className="block font-semibold">{parentAuthor?.label ?? 'Respuesta'}</span>
                      <span className="line-clamp-2">{parent?.is_deleted ? t('deletedMessage') : parent?.content ?? 'Mensaje anterior'}</span>
                    </div>
                  )}
                  <span className="whitespace-pre-wrap">{message.is_deleted ? t('deletedMessage') : message.content ?? ''}</span>
                </div>
                <div className="flex items-center gap-2 px-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                  <time dateTime={message.created_at}>{formatTime(message.created_at)}</time>
                  {!message.is_deleted && identity && <button type="button" onClick={() => onReply(message)} className="font-medium text-primary-700 hover:underline dark:text-primary-300">Responder</button>}
                  {isOwn && !message.is_deleted && identity?.kind !== 'guest' && <button type="button" onClick={() => onDelete(message.id)} className="font-medium text-red-700 hover:underline dark:text-red-400">Eliminar</button>}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
