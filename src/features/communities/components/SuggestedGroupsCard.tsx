'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useSuggestedCommunities, useJoinCommunity } from '@/features/communities/hooks/useCommunities'
import { PlusIcon } from '@/components/icons/heroicons-shim'
import { isFeatureEnabled } from '@/config/features-flag'

const MAX_VISIBLE = 3

function formatMemberCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}K miembros`
  return `${n} miembros`
}

export function SuggestedGroupsCard() {
  const enabled = isFeatureEnabled('GRUPOS_ENABLED') || isFeatureEnabled('COMUNIDADES_ENABLED')
  const { data, refetch } = useSuggestedCommunities(6)
  const join = useJoinCommunity()
  const [joinedIds, setJoinedIds] = useState<Set<string>>(() => new Set())

  if (!enabled) return null

  const items = (data?.data ?? []).filter((c) => !c.isMember && !joinedIds.has(c.id)).slice(0, MAX_VISIBLE)

  if (items.length === 0) return null

  const handleJoin = async (id: string) => {
    setJoinedIds((s) => new Set(s).add(id))
    try {
      await join.mutateAsync(id)
      void refetch()
    } catch {
      setJoinedIds((s) => {
        const next = new Set(s)
        next.delete(id)
        return next
      })
    }
  }

  return (
    <div className="rounded-xl bg-white shadow-sm dark:bg-neutral-900">
      <div className="flex items-center justify-between px-4 pt-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Grupos sugeridos
        </h3>
        <Link href="/grupos" className="text-xs font-medium text-primary-600 hover:underline">
          Ver todos
        </Link>
      </div>

      <ul className="mt-3 space-y-3 px-4 pb-4">
        {items.map((c) => {
          const cover = c.coverImageUrl || c.profileImageUrl
          return (
            <li key={c.id} className="flex items-start gap-3">
              <Link
                href={`/grupos/${c.slug}` as never}
                className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-800"
              >
                {cover ? (
                  <Image src={cover} alt={c.name} fill sizes="48px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-neutral-500">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/grupos/${c.slug}` as never}
                  className="block truncate text-sm font-semibold text-neutral-900 hover:underline dark:text-neutral-100"
                >
                  {c.name}
                </Link>
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {formatMemberCount(c.stats?.membersCount ?? 0)}
                </p>
                <button
                  onClick={() => handleJoin(c.id)}
                  disabled={join.isPending}
                  className="mt-2 inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-60 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
                >
                  <PlusIcon className="size-3.5" />
                  Unirse
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default SuggestedGroupsCard
