'use client'

import { useState } from 'react'
import Avatar from '@/ui/Avatar'
import { ChevronDownIcon } from '@/components/icons/heroicons-shim'
import { useFriendships } from '@/features/friendships/hooks/useFriendships'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

type ActivityKind = 'joined' | 'connected' | 'posted'

interface ActivityItem {
  id: string
  kind: ActivityKind
  actor: { name: string; avatar?: string; initials?: string }
  when: string
  /** For 'connected': number of new connections. For 'posted': club name + thumb. */
  payload?: {
    connectionCount?: number
    connectionAvatars?: { src?: string; initials: string }[]
    clubName?: string
    thumbnail?: string
  }
}

function relativeEs(iso: string): string {
  try {
    return `Hace ${formatDistanceToNow(new Date(iso), { locale: es, addSuffix: false })}`
  } catch {
    return 'Reciente'
  }
}

function ActivityRow({
  item,
  onFollow,
  followed,
}: {
  item: ActivityItem
  onFollow?: (id: string) => void
  followed?: boolean
}) {
  const initials =
    item.actor.initials ?? (item.actor.name.charAt(0).toUpperCase() || '?')

  let body: React.ReactNode = null
  let trailing: React.ReactNode = null

  switch (item.kind) {
    case 'joined': {
      body = (
        <p className="truncate text-sm">
          <span className="font-medium text-neutral-900 dark:text-white">{item.actor.name}</span>
          <span className="text-neutral-500 dark:text-neutral-400"> se unió a Yebaam</span>
        </p>
      )
      trailing = (
        <button
          type="button"
          onClick={() => onFollow?.(item.id)}
          disabled={followed}
          className={cn(
            'shrink-0 rounded-md border px-3 py-1 text-xs font-medium transition-colors',
            followed
              ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-900/50 dark:bg-primary-900/30 dark:text-primary-300'
              : 'border-primary-300 text-primary-700 hover:bg-primary-50 dark:border-primary-800 dark:text-primary-400 dark:hover:bg-primary-900/20',
          )}
        >
          {followed ? 'Enviado' : 'Seguir'}
        </button>
      )
      break
    }
    case 'connected': {
      const count = item.payload?.connectionCount ?? 0
      const avatars = item.payload?.connectionAvatars ?? []
      body = (
        <p className="truncate text-sm">
          <span className="font-medium text-neutral-900 dark:text-white">{item.actor.name}</span>
          <span className="text-neutral-500 dark:text-neutral-400">
            {' '}
            conectó con {count} {count === 1 ? 'nueva persona' : 'nuevas personas'}
          </span>
        </p>
      )
      trailing = (
        <div className="flex shrink-0 items-center">
          <div className="flex -space-x-2">
            {avatars.slice(0, 3).map((a, i) => (
              <Avatar
                key={i}
                src={a.src}
                initials={a.initials}
                className="h-7 w-7 ring-2 ring-white dark:ring-neutral-900"
              />
            ))}
          </div>
          {count > 3 && (
            <span className="ml-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              +{count - 3}
            </span>
          )}
        </div>
      )
      break
    }
    case 'posted': {
      const club = item.payload?.clubName
      const thumb = item.payload?.thumbnail
      body = (
        <p className="truncate text-sm">
          <span className="font-medium text-neutral-900 dark:text-white">{item.actor.name}</span>
          <span className="text-neutral-500 dark:text-neutral-400"> publicó en el club </span>
          <span className="font-medium text-neutral-900 dark:text-white">{club}</span>
        </p>
      )
      trailing = thumb ? (
        <img
          src={thumb}
          alt={club || 'Publicación'}
          className="h-10 w-10 shrink-0 rounded-lg object-cover"
        />
      ) : null
      break
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
      <Avatar
        src={item.actor.avatar}
        initials={initials}
        className="h-10 w-10 shrink-0"
      />
      <div className="min-w-0 flex-1">
        {body}
        <p className="text-xs text-neutral-400 dark:text-neutral-500">{item.when}</p>
      </div>
      {trailing}
    </li>
  )
}

export function RecentActivity() {
  const { friends } = useFriendships()
  const [expanded, setExpanded] = useState(false)
  const [followed, setFollowed] = useState<Set<string>>(new Set())

  const friendsList = (friends || []).filter((f: any) => f.friendSince)

  // Build a typed activity feed. We don't have a dedicated activity endpoint
  // yet, so derive items from friend data and mix in placeholder entries that
  // mirror the mockup layout. TODO: replace with real activity feed.
  const items: ActivityItem[] = []

  const newest = friendsList[0]
  if (newest) {
    items.push({
      id: `joined-${(newest as any).friendId}`,
      kind: 'joined',
      actor: {
        name:
          `${(newest as any).firstName || ''} ${(newest as any).lastName || ''}`.trim() ||
          (newest as any).username,
        avatar: (newest as any).avatar,
      },
      when: relativeEs((newest as any).friendSince),
    })
  }

  const second = friendsList[1]
  if (second && friendsList.length >= 2) {
    const peers = friendsList.slice(2, 6).map((f: any) => ({
      src: f.avatar,
      initials: `${(f.firstName?.[0] || f.username?.[0] || '?').toUpperCase()}`,
    }))
    items.push({
      id: `connected-${(second as any).friendId}`,
      kind: 'connected',
      actor: {
        name:
          `${(second as any).firstName || ''} ${(second as any).lastName || ''}`.trim() ||
          (second as any).username,
        avatar: (second as any).avatar,
      },
      when: relativeEs((second as any).friendSince),
      payload: {
        connectionCount: Math.max(2, peers.length),
        connectionAvatars: peers,
      },
    })
  }

  const third = friendsList[2]
  if (third) {
    items.push({
      id: `posted-${(third as any).friendId}`,
      kind: 'posted',
      actor: {
        name:
          `${(third as any).firstName || ''} ${(third as any).lastName || ''}`.trim() ||
          (third as any).username,
        avatar: (third as any).avatar,
      },
      when: relativeEs((third as any).friendSince),
      payload: {
        clubName: 'Viajeros del Mundo',
      },
    })
  }

  const visible = expanded ? items : items.slice(0, 3)

  const handleFollow = (id: string) => {
    setFollowed((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="mb-4 text-base font-semibold text-neutral-900 sm:text-lg dark:text-white">
        Actividad reciente
      </h2>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Aún no hay actividad reciente
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => (
            <ActivityRow
              key={item.id}
              item={item}
              onFollow={handleFollow}
              followed={followed.has(item.id)}
            />
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <div className="mt-4 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            {expanded ? 'Ver menos actividad' : 'Ver más actividad'}
            <ChevronDownIcon
              className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      )}
    </section>
  )
}
