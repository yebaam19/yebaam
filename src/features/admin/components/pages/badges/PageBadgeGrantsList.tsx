'use client'

import Image from 'next/image'

/** Active grant as returned by GET /api/pages/[idOrSlug]/badges. */
export interface PageBadgeGrant {
  grantId: string
  reason: string | null
  awardedAt: string
  badge: {
    id: string
    slug: string
    name: string
    description: string | null
    tier: string | null
    iconUrl: string | null
  } | null
}

interface Props {
  grants: PageBadgeGrant[]
  busy: boolean
  onRevoke: (grantId: string) => Promise<void>
}

export function PageBadgeGrantsList({ grants, busy, onRevoke }: Props) {
  if (grants.length === 0) {
    return <p className="mt-1 text-sm text-neutral-400">La página no tiene insignias activas.</p>
  }

  return (
    <ul className="mt-2 divide-y divide-neutral-100 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
      {grants.map((g) => (
        <li key={g.grantId} className="flex items-center gap-3 px-3 py-2">
          {g.badge?.iconUrl ? (
            <Image
              src={g.badge.iconUrl}
              alt=""
              width={28}
              height={28}
              className="size-7 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <span className="size-7 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {g.badge?.name ?? 'Insignia eliminada'}
              {g.badge?.tier ? (
                <span className="ml-1 text-xs font-normal text-neutral-500">({g.badge.tier})</span>
              ) : null}
            </span>
            <span className="block truncate text-xs text-neutral-500">
              {new Date(g.awardedAt).toLocaleDateString('es-ES')}
              {g.reason ? ` · ${g.reason}` : ''}
            </span>
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onRevoke(g.grantId)}
            className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            Revocar
          </button>
        </li>
      ))}
    </ul>
  )
}
