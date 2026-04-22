'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Avatar from '@/ui/Avatar'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime'
import type {
  ClientChatIdentity,
  PublicChatTopic,
  PublicMessageRow,
  PublicMessageSender,
  PublicMessageWithSender,
  ResolvedMessageAuthor,
} from '../types'
import { sendChatMessage, softDeletePublicMessage } from '../actions/chat-publico.actions'
import { capabilitiesFor } from '../lib/permissions'

interface Props {
  topic: PublicChatTopic
  initialMessages: PublicMessageWithSender[]
  identity: ClientChatIdentity | null
}

const MAX_LENGTH = 2000
const PAGE_SIZE = 30

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function resolveAuthor(message: PublicMessageWithSender): ResolvedMessageAuthor {
  const kind = (message.sender_kind as ResolvedMessageAuthor['kind']) || 'profile'
  if (kind === 'profile' || kind === 'nick') {
    if (message.sender) {
      const label =
        message.sender.display_name ||
        message.sender.username ||
        message.sender_nickname ||
        'Usuario'
      return {
        label,
        avatarUrl: message.sender.avatar_url ?? message.sender_avatar_url ?? null,
        kind,
        userId: message.sender_id ?? null,
      }
    }
    return {
      label: message.sender_nickname || 'Usuario',
      avatarUrl: message.sender_avatar_url ?? null,
      kind,
      userId: message.sender_id ?? null,
    }
  }
  return {
    label: message.sender_nickname || 'Invitado',
    avatarUrl: null,
    kind: 'guest',
    userId: null,
  }
}

function authorInitials(label: string) {
  const parts = label.split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] ?? 'U').concat(parts[1]?.[0] ?? '').toUpperCase().slice(0, 2)
}

export default function ChatPublicoView({ topic, initialMessages, identity }: Props) {
  const [messages, setMessages] = useState<PublicMessageWithSender[]>(() =>
    [...initialMessages].reverse(),
  )
  const [draft, setDraft] = useState('')
  const [isPending, startTransition] = useTransition()
  const [cooldownUntil, setCooldownUntil] = useState<number>(0)
  const [cooldownNow, setCooldownNow] = useState<number>(Date.now())
  const [error, setError] = useState<string | null>(null)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(initialMessages.length >= 50)

  const listRef = useRef<HTMLDivElement | null>(null)
  const atBottomRef = useRef(true)
  const locallySentRef = useRef<Set<string>>(new Set())
  const profileCacheRef = useRef<Map<string, PublicMessageSender>>(
    new Map(
      initialMessages
        .filter((m) => m.sender && m.sender_id)
        .map((m) => [m.sender_id as string, m.sender as PublicMessageSender]),
    ),
  )

  const caps = capabilitiesFor(identity)
  const remainingMs = Math.max(0, cooldownUntil - cooldownNow)
  const cooling = remainingMs > 0

  useEffect(() => {
    if (!cooling) return
    const t = setInterval(() => setCooldownNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [cooling])

  const scrollToBottom = useCallback((smooth: boolean) => {
    const el = listRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  useEffect(() => {
    scrollToBottom(false)
  }, [scrollToBottom])

  useEffect(() => {
    if (atBottomRef.current) scrollToBottom(true)
  }, [messages.length, scrollToBottom])

  const handleScroll = useCallback(() => {
    const el = listRef.current
    if (!el) return
    const threshold = 80
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
  }, [])

  const fetchSenders = useCallback(async (ids: string[]) => {
    const missing = ids.filter((id) => id && !profileCacheRef.current.has(id))
    if (missing.length === 0) return
    const client = createClient()
    const { data } = await client
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', missing)
    if (!data) return
    for (const row of data as Array<PublicMessageSender & { id: string }>) {
      profileCacheRef.current.set(row.id, {
        username: row.username,
        display_name: row.display_name,
        avatar_url: row.avatar_url,
      })
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.sender || !m.sender_id
          ? m
          : { ...m, sender: profileCacheRef.current.get(m.sender_id) ?? null },
      ),
    )
  }, [])

  useEffect(() => {
    const channel = subscribeToTable<PublicMessageRow>({
      channel: `chat-publico:topic:${topic.id}`,
      table: 'public_chat_messages',
      filter: `topic_id=eq.${topic.id}`,
      events: ['INSERT', 'UPDATE'],
      onChange: (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = payload.new as PublicMessageRow
          if (!row?.id || row.is_deleted) return
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev
            const sender = row.sender_id
              ? profileCacheRef.current.get(row.sender_id) ?? null
              : null
            const enriched: PublicMessageWithSender = { ...row, sender }
            return [...prev, enriched]
          })
          if (row.sender_id && !profileCacheRef.current.has(row.sender_id)) {
            void fetchSenders([row.sender_id])
          }
          return
        }
        if (payload.eventType === 'UPDATE') {
          const row = payload.new as PublicMessageRow
          if (!row?.id) return
          setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, ...row } : m)))
        }
      },
    })
    return () => unsubscribe(channel)
  }, [fetchSenders, topic.id])

  const loadOlder = useCallback(async () => {
    if (isLoadingOlder || !hasMore) return
    const first = messages[0]
    if (!first) return
    setIsLoadingOlder(true)
    try {
      const client = createClient()
      const { data } = await client
        .from('public_chat_messages')
        .select(
          'id, content, sender_id, sender_kind, sender_nickname, sender_avatar_url, created_at, is_deleted, topic_id, media_url, media_type, parent_message_id, reply_count, reaction_count, is_trending, sender:sender_id(username, display_name, avatar_url)',
        )
        .eq('topic_id', topic.id)
        .eq('is_deleted', false)
        .lt('created_at', first.created_at)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)
      const rows = (data as unknown as PublicMessageWithSender[] | null) ?? []
      if (rows.length > 0) {
        const el = listRef.current
        const prevHeight = el?.scrollHeight ?? 0
        for (const r of rows) {
          if (r.sender && r.sender_id)
            profileCacheRef.current.set(r.sender_id, r.sender)
        }
        setMessages((prev) => [...rows.slice().reverse(), ...prev])
        requestAnimationFrame(() => {
          if (el) el.scrollTop = el.scrollHeight - prevHeight
        })
      }
      setHasMore(rows.length === PAGE_SIZE)
    } finally {
      setIsLoadingOlder(false)
    }
  }, [isLoadingOlder, hasMore, messages, topic.id])

  const submit = useCallback(
    (content: string) => {
      setError(null)
      startTransition(async () => {
        const res = await sendChatMessage(topic.id, content)
        if (res.ok) {
          if (res.messageId) locallySentRef.current.add(res.messageId)
          setDraft('')
          return
        }
        if (res.error === 'rate_limited') {
          const ms = res.retryAfterMs ?? 2000
          setCooldownUntil(Date.now() + ms)
          setCooldownNow(Date.now())
          setError(`Espera ${Math.ceil(ms / 1000)}s antes de enviar otro mensaje.`)
        } else if (res.error === 'invalid') {
          setError('El mensaje no puede estar vacío ni exceder 2000 caracteres.')
        } else if (res.error === 'unauthorized') {
          setError('Debes entrar a la sala para enviar mensajes.')
        } else {
          setError('No se pudo enviar el mensaje. Intenta de nuevo.')
        }
      })
    },
    [topic.id],
  )

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed || isPending || cooling || !caps.canChat) return
    submit(trimmed)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const trimmed = draft.trim()
      if (!trimmed || isPending || cooling || !caps.canChat) return
      submit(trimmed)
    }
  }

  const handleDelete = useCallback(async (id: string) => {
    const res = await softDeletePublicMessage(id)
    if (!res.ok) {
      setError('No se pudo eliminar el mensaje.')
    }
  }, [])

  const grouped = useMemo(() => {
    return messages.map((m, i) => {
      const prev = messages[i - 1]
      const sameSenderAsPrev =
        !!prev &&
        prev.sender_id === m.sender_id &&
        prev.sender_nickname === m.sender_nickname &&
        prev.sender_kind === m.sender_kind &&
        new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 60_000
      return { message: m, showHeader: !sameSenderAsPrev }
    })
  }, [messages])

  return (
    <div className="flex h-full flex-col bg-white dark:bg-neutral-900">
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-4 sm:px-6"
      >
        {hasMore && (
          <div className="mb-4 flex justify-center">
            <button
              type="button"
              onClick={loadOlder}
              disabled={isLoadingOlder}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              {isLoadingOlder ? 'Cargando…' : 'Cargar mensajes anteriores'}
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-neutral-500 dark:text-neutral-400">
            <p className="text-sm">Todavía no hay mensajes. Sé el primero en saludar.</p>
          </div>
        )}

        <ul className="flex flex-col gap-1">
          {grouped.map(({ message, showHeader }) => {
            const author = resolveAuthor(message)
            const isOwn =
              !!identity &&
              ((identity.kind !== 'guest' &&
                !!message.sender_id &&
                message.sender_id === identity.userId) ||
                locallySentRef.current.has(message.id))
            return (
              <li
                key={message.id}
                className={cn('flex items-end gap-2', isOwn && 'flex-row-reverse')}
              >
                <div className="w-8 shrink-0">
                  {showHeader && !isOwn && (
                    <Avatar
                      src={author.avatarUrl ?? undefined}
                      alt={author.label}
                      initials={authorInitials(author.label)}
                      className="h-8 w-8"
                    />
                  )}
                </div>
                <div className={cn('flex max-w-[75%] flex-col gap-0.5', isOwn && 'items-end')}>
                  {showHeader && !isOwn && (
                    <span className="flex items-center gap-1.5 px-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      {author.label}
                      {author.kind === 'guest' && (
                        <span className="rounded-full bg-neutral-100 px-1.5 py-[1px] text-[9px] font-medium uppercase text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                          invitado
                        </span>
                      )}
                      {author.kind === 'nick' && (
                        <span className="rounded-full bg-neutral-100 px-1.5 py-[1px] text-[9px] font-medium uppercase text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                          nick
                        </span>
                      )}
                    </span>
                  )}
                  <div
                    className={cn(
                      'group relative rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words',
                      message.is_deleted
                        ? 'bg-neutral-100 italic text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
                        : isOwn
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100',
                    )}
                  >
                    {message.is_deleted ? 'Mensaje eliminado' : message.content ?? ''}
                    {isOwn && !message.is_deleted && identity?.kind !== 'guest' && (
                      <button
                        type="button"
                        onClick={() => handleDelete(message.id)}
                        className="absolute -top-2 -left-2 hidden rounded-full bg-white p-1 text-neutral-500 shadow ring-1 ring-black/5 hover:text-red-600 group-hover:inline-flex dark:bg-neutral-700 dark:text-neutral-300"
                        aria-label="Eliminar mensaje"
                        title="Eliminar"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <span className="px-1 text-[10px] text-neutral-400 dark:text-neutral-500">
                    {formatTime(message.created_at)}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <form
        onSubmit={onSubmit}
        className="border-t border-neutral-200 px-3 py-3 sm:px-6 dark:border-neutral-800"
      >
        {error && <p className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={MAX_LENGTH}
            disabled={!caps.canChat}
            placeholder={
              caps.canChat
                ? `Escribe un mensaje en ${topic.name}…`
                : 'Entra a la sala para chatear'
            }
            className="min-h-[40px] flex-1 resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-900 outline-hidden focus:border-primary-500 focus:bg-white disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:bg-neutral-900"
          />
          <button
            type="submit"
            disabled={isPending || cooling || !draft.trim() || !caps.canChat}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cooling ? `Espera ${Math.ceil(remainingMs / 1000)}s` : isPending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
        <p className="mt-1 px-1 text-[10px] text-neutral-400 dark:text-neutral-500">
          {draft.length}/{MAX_LENGTH} · Enter para enviar · Shift+Enter para salto de línea
          {identity?.kind === 'guest' && ' · Invitado: solo texto'}
          {identity?.kind === 'nick' && ' · Nick: texto + imágenes'}
        </p>
      </form>
    </div>
  )
}
