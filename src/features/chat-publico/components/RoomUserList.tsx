'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Avatar from '@/ui/Avatar'
import { cn } from '@/lib/utils'
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime'
import { heartbeatPresence } from '../actions/identity.actions'
import type { RoomPresenceRow, ClientChatIdentity } from '../types'

interface Props {
  roomId: string
  initialUsers: RoomPresenceRow[]
  identity: ClientChatIdentity | null
}

const HEARTBEAT_MS = 30_000
const STALE_MS = 120_000

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] ?? 'U').concat(parts[1]?.[0] ?? '').toUpperCase().slice(0, 2)
}

export default function RoomUserList({ roomId, initialUsers, identity }: Props) {
  const [users, setUsers] = useState<RoomPresenceRow[]>(initialUsers)
  const staleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Realtime: subscribe to presence INSERT/UPDATE/DELETE for this room.
  useEffect(() => {
    const channel = subscribeToTable<RoomPresenceRow>({
      channel: `chat-publico:presence:${roomId}`,
      table: 'public_chat_presence',
      filter: `room_id=eq.${roomId}`,
      events: ['INSERT', 'UPDATE', 'DELETE'],
      onChange: (payload) => {
        if (payload.eventType === 'DELETE') {
          const old = payload.old as RoomPresenceRow
          if (!old?.id) return
          setUsers((prev) => prev.filter((u) => u.id !== old.id))
          return
        }
        const row = payload.new as RoomPresenceRow
        if (!row?.id) return
        setUsers((prev) => {
          const idx = prev.findIndex((u) => u.id === row.id)
          if (idx === -1) return [...prev, row]
          const next = prev.slice()
          next[idx] = row
          return next
        })
      },
    })
    return () => unsubscribe(channel)
  }, [roomId])

  // Heartbeat — keep our presence row fresh while mounted.
  useEffect(() => {
    if (!identity) return
    const tick = () => {
      void heartbeatPresence(roomId)
    }
    tick()
    const id = setInterval(tick, HEARTBEAT_MS)
    return () => clearInterval(id)
  }, [identity, roomId])

  // Client-side staleness sweep so users that stopped heartbeating fall off.
  useEffect(() => {
    staleTimerRef.current = setInterval(() => {
      const cutoff = Date.now() - STALE_MS
      setUsers((prev) => prev.filter((u) => new Date(u.last_seen_at).getTime() >= cutoff))
    }, 15_000)
    return () => {
      if (staleTimerRef.current) clearInterval(staleTimerRef.current)
    }
  }, [])

  const sorted = useMemo(() => {
    return [...users].sort((a, b) => {
      const order = (k: string) => (k === 'profile' ? 0 : k === 'nick' ? 1 : 2)
      const diff = order(a.identity_kind) - order(b.identity_kind)
      if (diff !== 0) return diff
      return a.display_name.localeCompare(b.display_name)
    })
  }, [users])

  return (
    <aside className="hidden w-60 shrink-0 border-l border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:flex lg:flex-col">
      <header className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          En la sala · {sorted.length}
        </h2>
      </header>
      <ul className="flex-1 overflow-y-auto py-2">
        {sorted.length === 0 && (
          <li className="px-4 py-3 text-xs text-neutral-400">Nadie por aquí todavía.</li>
        )}
        {sorted.map((u) => {
          const isSelf =
            !!identity &&
            ((identity.kind !== 'guest' && identity.userId === u.user_id) ||
              (identity.kind === 'guest' && identity.nickname === u.display_name))
          return (
            <li
              key={u.id}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm',
                isSelf && 'bg-primary-50/60 dark:bg-primary-950/20',
              )}
            >
              <Avatar
                src={u.avatar_url ?? undefined}
                alt={u.display_name}
                initials={initials(u.display_name)}
                className="h-7 w-7"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate font-medium text-neutral-800 dark:text-neutral-100">
                    {u.display_name}
                  </span>
                  <KindBadge kind={u.identity_kind} />
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

function KindBadge({ kind }: { kind: 'profile' | 'nick' | 'guest' }) {
  if (kind === 'profile') return null
  const label = kind === 'nick' ? 'nick' : 'invitado'
  return (
    <span className="shrink-0 rounded-full bg-neutral-100 px-1.5 py-[1px] text-[10px] font-medium uppercase text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
      {label}
    </span>
  )
}
