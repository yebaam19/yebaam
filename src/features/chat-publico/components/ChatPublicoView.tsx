'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Avatar from '@/ui/Avatar'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime'
import type {
  PublicChatTopic,
  PublicMessageRow,
  PublicMessageSender,
  PublicMessageWithSender,
} from '../types'
import {
  sendPublicMessage,
  softDeletePublicMessage,
} from '../actions/chat-publico.actions'
import TopicTabs from './TopicTabs'

interface Props {
  topic: PublicChatTopic
  topics: PublicChatTopic[]
  initialMessages: PublicMessageWithSender[]
  currentUserId: string
}

const MAX_LENGTH = 2000
const PAGE_SIZE = 30

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function senderLabel(sender: PublicMessageSender | null | undefined) {
  if (!sender) return 'Usuario'
  return sender.display_name || sender.username || 'Usuario'
}

function senderInitials(sender: PublicMessageSender | null | undefined) {
  const label = senderLabel(sender)
  const parts = label.split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] ?? 'U').concat(parts[1]?.[0] ?? '').toUpperCase().slice(0, 2)
}

export default function ChatPublicoView({ topic, topics, initialMessages, currentUserId }: Props) {
  const [messages, setMessages] = useState<PublicMessageWithSender[]>(() =>
    [...initialMessages].reverse()
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
  const profileCacheRef = useRef<Map<string, PublicMessageSender>>(
    new Map(
      initialMessages
        .filter((m) => m.sender)
        .map((m) => [m.sender_id, m.sender as PublicMessageSender])
    )
  )

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
    const missing = ids.filter((id) => !profileCacheRef.current.has(id))
    if (missing.length === 0) return
    const client = createClient()
    const { data } = await client
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', missing)
    if (!data) return
    for (const row of data as Array<
      PublicMessageSender & { id: string }
    >) {
      profileCacheRef.current.set(row.id, {
        username: row.username,
        display_name: row.display_name,
        avatar_url: row.avatar_url,
      })
    }
    setMessages((prev) =>
      prev.map((m) =>
        m.sender ? m : { ...m, sender: profileCacheRef.current.get(m.sender_id) ?? null }
      )
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
            const sender = profileCacheRef.current.get(row.sender_id) ?? null
            const enriched: PublicMessageWithSender = { ...row, sender }
            return [...prev, enriched]
          })
          if (!profileCacheRef.current.has(row.sender_id)) {
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
          'id, content, sender_id, created_at, is_deleted, topic_id, sender:sender_id(username, display_name, avatar_url)'
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
          if (r.sender) profileCacheRef.current.set(r.sender_id, r.sender)
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
  }, [isLoadingOlder, hasMore, messages])

  const submit = useCallback(
    (content: string) => {
      setError(null)
      startTransition(async () => {
        const res = await sendPublicMessage(content, topic.id)
        if (res.ok) {
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
          setError('Debes iniciar sesión para enviar mensajes.')
        } else {
          setError('No se pudo enviar el mensaje. Intenta de nuevo.')
        }
      })
    },
    [topic.id]
  )

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed || isPending || cooling) return
    submit(trimmed)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const trimmed = draft.trim()
      if (!trimmed || isPending || cooling) return
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
        prev && prev.sender_id === m.sender_id &&
        new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < 60_000
      return { message: m, showHeader: !sameSenderAsPrev }
    })
  }, [messages])

  return (
    <div className="flex h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] flex-col bg-white dark:bg-neutral-900">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3h6m-7.125 8.25 3.375-3H18a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v9.75a3 3 0 0 0 3 3h.375Z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Chat Público · {topic.name}
          </h1>
          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            {topic.description ?? 'Canal público'}
          </p>
        </div>
      </header>

      <TopicTabs topics={topics} activeSlug={topic.slug} />

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
            const isOwn = message.sender_id === currentUserId
            const sender = message.sender
            const label = senderLabel(sender)
            return (
              <li
                key={message.id}
                className={cn('flex items-end gap-2', isOwn && 'flex-row-reverse')}
              >
                <div className="w-8 shrink-0">
                  {showHeader && !isOwn && (
                    <Avatar
                      src={sender?.avatar_url ?? undefined}
                      alt={label}
                      initials={senderInitials(sender)}
                      className="h-8 w-8"
                    />
                  )}
                </div>
                <div className={cn('flex max-w-[75%] flex-col gap-0.5', isOwn && 'items-end')}>
                  {showHeader && !isOwn && (
                    <span className="px-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      {label}
                    </span>
                  )}
                  <div
                    className={cn(
                      'group relative rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words',
                      message.is_deleted
                        ? 'bg-neutral-100 italic text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500'
                        : isOwn
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                    )}
                  >
                    {message.is_deleted ? 'Mensaje eliminado' : message.content}
                    {isOwn && !message.is_deleted && (
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
        {error && (
          <p className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={onKeyDown}
            rows={1}
            maxLength={MAX_LENGTH}
            placeholder={`Escribe un mensaje en ${topic.name}…`}
            className="min-h-[40px] flex-1 resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-900 outline-hidden focus:border-primary-500 focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:bg-neutral-900"
          />
          <button
            type="submit"
            disabled={isPending || cooling || !draft.trim()}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cooling ? `Espera ${Math.ceil(remainingMs / 1000)}s` : isPending ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
        <p className="mt-1 px-1 text-[10px] text-neutral-400 dark:text-neutral-500">
          {draft.length}/{MAX_LENGTH} · Enter para enviar · Shift+Enter para salto de línea
        </p>
      </form>
    </div>
  )
}
