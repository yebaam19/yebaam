'use client'

import Link from 'next/link'
import { useState } from 'react'
import Avatar from '@/ui/Avatar'
import { XMarkIcon } from '@/components/icons/heroicons-shim'
import { cn } from '@/lib/utils'
import { useFriendships } from '@/features/friendships/hooks/useFriendships'
import { useTranslations } from 'next-intl'

export function HighlightedSuggestions() {
  const t = useTranslations('nav')
  // Store suggestions are loaded once by useFriendships() (limit 10); slice here.
  const { suggestions, sendFriendRequest, isLoading } = useFriendships()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [followed, setFollowed] = useState<Set<string>>(new Set())

  const list = (suggestions || []).filter((s) => !dismissed.has(s.id)).slice(0, 3)

  const handleFollow = async (id: string) => {
    if (followed.has(id)) return
    try {
      await sendFriendRequest({ addresseeId: id })
      setFollowed((prev) => {
        const next = new Set(prev)
        next.add(id)
        return next
      })
    } catch {
      /* surfaced via toast in the hook */
    }
  }

  const handleDismiss = (id: string) =>
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })

  const showSkeleton = isLoading && list.length === 0

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t('highlightedSuggestions')}
        </h3>
        <Link
          href="/feed/friends?tab=suggestions"
          className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {t('viewAllSuggestions')}
        </Link>
      </header>

      {showSkeleton ? (
        <ul className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <span className="block h-3 w-2/3 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
                <span className="block h-2 w-1/2 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
              </div>
              <span className="h-6 w-12 shrink-0 animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-800" />
            </li>
          ))}
        </ul>
      ) : list.length === 0 ? (
        <p className="py-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
          {t('noSuggestionsForNow')}
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((s) => {
            const fullName = `${s.firstName} ${s.lastName}`.trim() || s.username
            const isFollowed = followed.has(s.id)
            return (
              <li key={s.id} className="flex items-center gap-3">
                <Avatar
                  src={s.avatar}
                  initials={`${s.firstName?.[0] || ''}${s.lastName?.[0] || ''}`.toUpperCase()}
                  className="h-10 w-10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                    {fullName}
                  </p>
                  <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                    {s.location || t('yebaamLocation')}
                  </p>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                    {t('mutualFriends', { n: s.mutualFriends })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleFollow(s.id)}
                    disabled={isFollowed}
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                      isFollowed
                        ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-900/50 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'border-primary-300 text-primary-700 hover:bg-primary-50 dark:border-primary-800 dark:text-primary-400 dark:hover:bg-primary-900/20',
                    )}
                  >
                    {isFollowed ? t('sent') : t('follow')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismiss(s.id)}
                    aria-label={t('dismissSuggestion')}
                    className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                  >
                    <XMarkIcon className="size-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
