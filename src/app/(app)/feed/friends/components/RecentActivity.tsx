'use client'

import { useState } from 'react'
import Link from 'next/link'
import Avatar from '@/ui/Avatar'
import { ChevronDownIcon } from '@/components/icons/heroicons-shim'
import { useFriendships } from '@/features/friendships/hooks/useFriendships'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface ActivityItem {
  id: string
  username: string
  name: string
  avatar?: string
  initials: string
  when: string
  sinceMs: number
}

function relativeEs(iso: string): string {
  try {
    return `Hace ${formatDistanceToNow(new Date(iso), { locale: es, addSuffix: false })}`
  } catch {
    return 'Reciente'
  }
}

export function RecentActivity() {
  const { friends } = useFriendships()
  const [expanded, setExpanded] = useState(false)

  const items: ActivityItem[] = (friends || [])
    .filter((f: any) => !!f.friendSince)
    .map((f: any) => {
      const name = `${f.firstName || ''} ${f.lastName || ''}`.trim() || f.username
      const initials = `${(f.firstName?.[0] || f.username?.[0] || '?').toUpperCase()}${(f.lastName?.[0] || '').toUpperCase()}`
      return {
        id: f.friendId,
        username: f.username,
        name,
        avatar: f.avatar,
        initials,
        when: relativeEs(f.friendSince),
        sinceMs: new Date(f.friendSince).getTime() || 0,
      }
    })
    .sort((a: ActivityItem, b: ActivityItem) => b.sinceMs - a.sinceMs)

  const visible = expanded ? items : items.slice(0, 3)

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
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            >
              <Avatar
                src={item.avatar}
                initials={item.initials}
                className="h-10 w-10 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">Te conectaste con </span>
                  <span className="font-medium text-neutral-900 dark:text-white">{item.name}</span>
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">{item.when}</p>
              </div>
              {item.username && (
                <Link
                  href={`/${item.username}`}
                  className="shrink-0 rounded-md border border-primary-300 px-3 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50 dark:border-primary-800 dark:text-primary-400 dark:hover:bg-primary-900/20"
                >
                  Ver perfil
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}

      {items.length > 3 && (
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
