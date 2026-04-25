'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import Avatar from '@/ui/Avatar'
import {
  CheckIcon,
  ChevronRightIcon,
  UserPlusIcon,
} from '@/components/icons/heroicons-shim'
import { cn } from '@/lib/utils'
import { useFriendships } from '@/features/friendships/hooks/useFriendships'
import { usePresenceStore } from '@/features/presence/store/presence.store'
import type { FriendSuggestion } from '@/features/friendships/services/friendships.service'

function StatusBadge({ online }: { online: boolean }) {
  if (online) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
        <span className="size-1.5 rounded-full bg-white" />
        En línea
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-md bg-neutral-900/70 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
      Hace 2 horas
    </span>
  )
}

function SuggestionCard({
  suggestion,
  onSend,
  online,
}: {
  suggestion: FriendSuggestion
  online: boolean
  onSend: (id: string) => Promise<void>
}) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (sent || loading) return
    setLoading(true)
    try {
      await onSend(suggestion.id)
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  const fullName = `${suggestion.firstName} ${suggestion.lastName}`.trim() || suggestion.username

  return (
    <article className="flex w-56 shrink-0 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white snap-start dark:border-neutral-800 dark:bg-neutral-900 sm:w-auto">
      <div className="relative h-32 bg-gradient-to-br from-primary-100 to-primary-300 dark:from-primary-900/40 dark:to-primary-800/40">
        {suggestion.avatar ? (
          <img
            src={suggestion.avatar}
            alt={fullName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Avatar
              initials={`${suggestion.firstName?.[0] || ''}${suggestion.lastName?.[0] || ''}`.toUpperCase()}
              className="h-16 w-16"
            />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge online={online} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
          {fullName}
        </h3>
        <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
          {suggestion.bio || 'Miembro de Yebaam'}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block size-4 rounded-full border border-white bg-neutral-200 dark:border-neutral-900 dark:bg-neutral-700"
              />
            ))}
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {suggestion.mutualFriends} amigos en común
          </p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={sent || loading}
          className={cn(
            'mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
            sent
              ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-900/50 dark:bg-primary-900/30 dark:text-primary-300'
              : 'border-primary-200 bg-white text-primary-700 hover:bg-primary-50 dark:border-primary-900/50 dark:bg-neutral-900 dark:text-primary-400 dark:hover:bg-primary-900/20',
            (sent || loading) && 'cursor-default opacity-90',
          )}
        >
          {sent ? (
            <>
              <CheckIcon className="size-3.5" />
              Enviado
            </>
          ) : (
            <>
              <UserPlusIcon className="size-3.5" />
              Agregar
            </>
          )}
        </button>
      </div>
    </article>
  )
}

export function SuggestedPeopleRail() {
  const { suggestions, sendFriendRequest } = useFriendships()
  const isUserOnline = usePresenceStore((s) => s.isUserOnline)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const items = (suggestions || []).slice(0, 8)

  if (items.length === 0) return null

  const scrollNext = () => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: el.clientWidth * 0.8, behavior: 'smooth' })
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-neutral-900 sm:text-lg dark:text-white">
          Personas sugeridas para ti
        </h2>
        <Link
          href="/feed/friends?tab=suggestions"
          className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          Ver todas
        </Link>
      </header>

      <div className="relative">
        <div
          ref={scrollerRef}
          className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4"
        >
          {items.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              online={isUserOnline(s.id)}
              onSend={async (id) => {
                await sendFriendRequest({ addresseeId: id })
              }}
            />
          ))}
        </div>

        {items.length > 4 && (
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Ver más sugerencias"
            className="absolute top-1/2 right-0 hidden -translate-y-1/2 translate-x-1 items-center justify-center rounded-full border border-neutral-200 bg-white p-1.5 text-neutral-600 shadow-md transition-colors hover:bg-neutral-50 lg:flex dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <ChevronRightIcon className="size-4" />
          </button>
        )}
      </div>
    </section>
  )
}
