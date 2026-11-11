'use client'

import { PlusIcon } from '@/components/icons/heroicons-shim'
import { isFeatureEnabled } from '@/config/features-flag'
import { useJoinCommunity,useSuggestedCommunities } from '@/features/communities/hooks/useCommunities'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { primaryActionStyles } from '@/ui/primary-action-styles'

const MAX_VISIBLE = 3

function formatMemberCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}K miembros`
  return `${n} ${n === 1 ? 'miembro' : 'miembros'}`
}

export function SuggestedGroupsCard() {
  const enabled = isFeatureEnabled('GRUPOS_ENABLED') || isFeatureEnabled('COMUNIDADES_ENABLED')
  const { data } = useSuggestedCommunities()
  const join = useJoinCommunity()
  const [joinedIds, setJoinedIds] = useState<Set<string>>(() => new Set())

  if (!enabled) return null

  const items = (data?.data ?? []).filter((c) => !c.isMember && !joinedIds.has(c.id)).slice(0, MAX_VISIBLE)

  if (items.length === 0) return null

  const handleJoin = async (id: string) => {
    setJoinedIds((s) => new Set(s).add(id))
    try {
      await join.mutateAsync(id)
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
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <h3 className="min-w-0 text-sm font-semibold leading-5 text-neutral-900 dark:text-neutral-100">
          Comunidades sugeridas
        </h3>
        <Link href="/comunidades" className="shrink-0 rounded-sm text-xs font-medium leading-5 text-primary-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 dark:text-primary-400 dark:focus-visible:outline-primary-400">
          Ver todos
        </Link>
      </div>

      <ul className="mt-3 space-y-3 px-4 pb-4">
        {items.map((c) => {
          const cover = c.coverImageUrl || c.profileImageUrl
          return (
            <li key={c.id} className="flex items-start gap-3">
              <Link
                href={`/comunidades/${c.slug}` as never}
                className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-neutral-200 dark:bg-neutral-800"
              >
                {cover ? (
                  <Image src={cover} alt={c.name} fill sizes="48px" className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-neutral-500">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/comunidades/${c.slug}` as never}
                  title={c.name}
                  className="line-clamp-2 break-words text-sm font-semibold leading-5 text-neutral-900 hover:underline dark:text-neutral-100"
                >
                  {c.name}
                </Link>
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                  {formatMemberCount(c.stats?.membersCount ?? 0)}
                </p>
                <button
                  type="button"
                  aria-label={`Unirse a ${c.name}`}
                  onClick={() => handleJoin(c.id)}
                  disabled={join.isPending}
                  className={`${primaryActionStyles} mt-2 inline-flex items-center gap-1 px-2.5 py-1 text-xs`}
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
