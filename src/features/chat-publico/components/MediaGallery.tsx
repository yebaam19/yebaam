'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Avatar from '@/ui/Avatar'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime'
import { resolveMessageSenderAvatars } from '../lib/avatar'
import type {
  PublicMessageRow,
  PublicMessageSender,
  PublicMessageWithSender,
} from '../types'

export type MediaMode = 'photos' | 'videos' | 'trending'

interface Props {
  roomId: string
  mode: MediaMode
  onClose: () => void
}

const TTL_HOURS = 24

const MODE_CONFIG: Record<
  MediaMode,
  { label: string; emptyMsg: string; description: string }
> = {
  photos: {
    label: 'Fotos y Gifs',
    emptyMsg: 'Aún no hay fotos ni gifs en las últimas 24 horas.',
    description: 'Imágenes y gifs publicados en esta sala en las últimas 24 h.',
  },
  videos: {
    label: 'Videos',
    emptyMsg: 'Aún no hay videos en las últimas 24 horas.',
    description: 'Videos publicados en esta sala en las últimas 24 h.',
  },
  trending: {
    label: 'Tendencia',
    emptyMsg: 'Ningún mensaje en tendencia todavía. Se necesitan 30+ reacciones.',
    description: 'Mensajes con 30 o más reacciones en las últimas 24 h.',
  },
}

const SELECT_COLS =
  'id, content, sender_id, sender_kind, sender_nickname, sender_avatar_url, created_at, is_deleted, topic_id, media_url, media_type, parent_message_id, reply_count, reaction_count, is_trending, trending_at, sender:sender_id(username, display_name, avatar_url, avatar_cloudflare_id)'

function matchesMode(mode: MediaMode, row: PublicMessageRow): boolean {
  if (row.is_deleted) return false
  if (mode === 'photos') return row.media_type === 'image' || row.media_type === 'gif'
  if (mode === 'videos') return row.media_type === 'video'
  return !!row.is_trending
}

function senderLabel(m: PublicMessageWithSender): string {
  if (m.sender_nickname) return m.sender_nickname
  if (m.sender?.display_name) return m.sender.display_name
  if (m.sender?.username) return m.sender.username
  return 'Usuario'
}

function senderInitials(label: string) {
  const parts = label.split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] ?? 'U').concat(parts[1]?.[0] ?? '').toUpperCase().slice(0, 2)
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  return `hace ${hrs} h`
}

export default function MediaGallery({ roomId, mode, onClose }: Props) {
  const [rows, setRows] = useState<PublicMessageWithSender[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const modeRef = useRef(mode)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const cutoff = useMemo(
    () => new Date(Date.now() - TTL_HOURS * 3600 * 1000).toISOString(),
    [],
  )

  const fetchRows = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const client = createClient()
      let q = client
        .from('public_chat_messages')
        .select(SELECT_COLS)
        .eq('topic_id', roomId)
        .eq('is_deleted', false)
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(120)

      if (mode === 'photos') q = q.in('media_type', ['image', 'gif'])
      else if (mode === 'videos') q = q.eq('media_type', 'video')
      else q = q.eq('is_trending', true)

      const { data, error: err } = await q
      if (err) throw err
      setRows(resolveMessageSenderAvatars((data as unknown as PublicMessageWithSender[] | null) ?? []))
    } catch (e) {
      setError((e as Error).message || 'No se pudo cargar.')
    } finally {
      setLoading(false)
    }
  }, [roomId, mode, cutoff])

  useEffect(() => {
    void fetchRows()
  }, [fetchRows])

  useEffect(() => {
    const channel = subscribeToTable<PublicMessageRow>({
      channel: `chat-publico:media:${roomId}:${mode}`,
      table: 'public_chat_messages',
      filter: `topic_id=eq.${roomId}`,
      events: ['INSERT', 'UPDATE', 'DELETE'],
      onChange: (payload) => {
        if (payload.eventType === 'DELETE') {
          const old = payload.old as PublicMessageRow
          if (!old?.id) return
          setRows((prev) => prev.filter((r) => r.id !== old.id))
          return
        }
        const row = payload.new as PublicMessageRow
        if (!row?.id) return
        if (!matchesMode(modeRef.current, row)) {
          setRows((prev) => prev.filter((r) => r.id !== row.id))
          return
        }
        setRows((prev) => {
          const idx = prev.findIndex((r) => r.id === row.id)
          const enriched: PublicMessageWithSender = {
            ...row,
            sender: prev[idx]?.sender ?? null,
          }
          if (idx === -1) return [enriched, ...prev]
          const next = prev.slice()
          next[idx] = { ...next[idx], ...row }
          return next
        })
      },
    })
    return () => unsubscribe(channel)
  }, [roomId, mode])

  const config = MODE_CONFIG[mode]
  const useGrid = mode !== 'trending'

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-900">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {config.label}
          </h2>
          <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
            {config.description}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Volver al chat
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 text-center text-neutral-500 dark:text-neutral-400">
            <EmptyIcon mode={mode} />
            <p className="text-sm">{config.emptyMsg}</p>
          </div>
        )}

        {!loading && !error && rows.length > 0 && useGrid && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {rows.map((m) => (
              <li
                key={m.id}
                className="group relative aspect-square overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800"
              >
                {mode === 'photos' ? (
                  <img
                    src={m.media_url ?? undefined}
                    alt={m.content ?? ''}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <video
                    src={m.media_url ?? undefined}
                    controls
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                  <span className="truncate text-[11px] font-medium text-white">
                    {senderLabel(m)}
                  </span>
                  <span className="ml-auto text-[10px] text-white/70">{timeAgo(m.created_at)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && !error && rows.length > 0 && !useGrid && (
          <ul className="flex flex-col gap-3">
            {rows.map((m) => {
              const label = senderLabel(m)
              return (
                <li
                  key={m.id}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950/40"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Avatar
                      src={m.sender?.avatar_url ?? m.sender_avatar_url ?? undefined}
                      alt={label}
                      initials={senderInitials(label)}
                      className="h-7 w-7"
                    />
                    <span className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
                      {label}
                    </span>
                    <span className="ml-auto shrink-0 text-[11px] text-neutral-400">
                      {timeAgo(m.created_at)}
                    </span>
                  </div>
                  {m.content && (
                    <p className="whitespace-pre-wrap break-words text-sm text-neutral-800 dark:text-neutral-100">
                      {m.content}
                    </p>
                  )}
                  {m.media_url && (m.media_type === 'image' || m.media_type === 'gif') && (
                    <img
                      src={m.media_url}
                      alt=""
                      className="mt-3 max-h-80 rounded-lg object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  {m.media_url && m.media_type === 'video' && (
                    <video
                      src={m.media_url}
                      controls
                      preload="metadata"
                      className="mt-3 max-h-80 w-full rounded-lg"
                    />
                  )}
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
                      (m.reaction_count ?? 0) >= 30
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'bg-neutral-100 dark:bg-neutral-800',
                    )}>
                      🔥 {m.reaction_count ?? 0} reacciones
                    </span>
                    <span>💬 {m.reply_count ?? 0} respuestas</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function EmptyIcon({ mode }: { mode: MediaMode }) {
  if (mode === 'videos') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 opacity-40">
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    )
  }
  if (mode === 'trending') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 opacity-40">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1 3.75 3.75 0 0 0 3.563 4.922Z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 opacity-40">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  )
}
