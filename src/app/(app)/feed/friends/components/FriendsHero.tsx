'use client'

import Link from 'next/link'
import Avatar from '@/ui/Avatar'
import { UserPlusIcon, ArrowUpTrayIcon } from '@/components/icons/heroicons-shim'
import { useFriendships } from '@/features/friendships/hooks/useFriendships'
import { useAuth } from '@/features/auth/context/auth-context'

interface NetworkAvatar {
  src?: string
  initials: string
}

function NetworkIllustration({ items }: { items: NetworkAvatar[] }) {
  const positions = [
    { top: '8%', left: '28%', size: 'h-14 w-14' },
    { top: '6%', right: '18%', size: 'h-16 w-16' },
    { top: '46%', right: '4%', size: 'h-14 w-14' },
    { bottom: '4%', right: '32%', size: 'h-16 w-16' },
    { bottom: '12%', left: '12%', size: 'h-12 w-12' },
  ]

  const pluses = [
    { top: '2%', left: '6%' },
    { top: '4%', right: '4%' },
    { top: '42%', right: '32%' },
    { bottom: '34%', left: '40%' },
    { bottom: '2%', left: '46%' },
  ]

  return (
    <div className="relative hidden h-52 w-80 shrink-0 lg:block">
      <svg
        className="absolute inset-0 h-full w-full text-primary-400/70 dark:text-primary-500/50"
        viewBox="0 0 320 208"
        fill="none"
        aria-hidden
      >
        <path
          d="M70 30 C 150 0, 230 40, 280 100 C 290 150, 200 200, 130 180 C 50 160, 10 90, 70 30 Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeDasharray="3 5"
          fill="none"
        />
      </svg>

      {/* Center silhouette */}
      <div className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary-200 bg-white shadow-md dark:border-primary-800 dark:bg-neutral-900">
        <svg viewBox="0 0 24 24" fill="none" className="size-7 text-primary-500">
          <path
            d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.5 0-7 1.75-7 5v1h14v-1c0-3.25-3.5-5-7-5z"
            fill="currentColor"
          />
        </svg>
      </div>

      {items.slice(0, 5).map((item, i) => {
        const pos = positions[i]
        if (!pos) return null
        return (
          <div
            key={i}
            className={`absolute ${pos.size} overflow-hidden rounded-full ring-4 ring-white shadow-lg dark:ring-neutral-900`}
            style={pos as React.CSSProperties}
          >
            <Avatar src={item.src} initials={item.initials} className="h-full w-full" />
          </div>
        )
      })}

      {pluses.map((pos, i) => (
        <span
          key={i}
          className="absolute text-base font-light text-primary-500/70 dark:text-primary-400/70"
          style={pos as React.CSSProperties}
          aria-hidden
        >
          +
        </span>
      ))}
    </div>
  )
}

export function FriendsHero() {
  const { user } = useAuth()
  const { friends, suggestions } = useFriendships()

  const firstName = user?.firstName || user?.username || 'amig@'

  const pool = [...(friends || []), ...(suggestions || [])]
  const avatars: NetworkAvatar[] = pool.slice(0, 5).map((p: any) => ({
    src: p.avatar,
    initials: `${(p.firstName?.[0] || p.username?.[0] || '?').toUpperCase()}${(p.lastName?.[0] || '').toUpperCase()}`,
  }))
  while (avatars.length < 5) {
    avatars.push({ initials: '·' })
  }

  return (
    <section className="rounded-2xl border border-primary-100 bg-primary-50/70 p-5 sm:p-7 dark:border-primary-900/40 dark:bg-primary-900/15">
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            ¡Hola, <span className="font-medium">{firstName}</span>! <span aria-hidden>👋</span>
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-neutral-900 sm:text-3xl dark:text-white">
            Conecta, comparte y
            <br className="hidden sm:block" /> crece tu red
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Hay miles de personas esperándote.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 sm:mt-5 sm:gap-3">
            <Link
              href="/feed/friends?tab=suggestions"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
            >
              <UserPlusIcon className="size-4" />
              Encontrar amigos
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <ArrowUpTrayIcon className="size-4" />
              Importar contactos
            </button>
          </div>
        </div>

        <NetworkIllustration items={avatars} />
      </div>
    </section>
  )
}
