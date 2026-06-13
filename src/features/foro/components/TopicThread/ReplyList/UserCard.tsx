import Link from 'next/link'
import type { Route } from 'next'
import type { ForoPost, ForoPostAuthorMeta } from '@/features/foro/types'
import { formatRelativeDate } from '@/features/foro/utils/format'
import { Badge } from '@/ui/Badge'
import UserAvatar from '../../UserAvatar'

export type RankLabels = {
  legend: string
  veteran: string
  senior: string
  registered: string
  newbie: string
}

function userRank(
  postCount: number,
  labels: RankLabels,
): { label: string; color: React.ComponentProps<typeof Badge>['color'] } {
  if (postCount >= 1000) return { label: labels.legend, color: 'purple' }
  if (postCount >= 500) return { label: labels.veteran, color: 'indigo' }
  if (postCount >= 100) return { label: labels.senior, color: 'sky' }
  if (postCount >= 20) return { label: labels.registered, color: 'green' }
  return { label: labels.newbie, color: 'zinc' }
}

export type UserCardStrings = {
  rank: RankLabels
  opLabel: string
  messagesLabel: string
  memberLabel: string
  locationLabel: string
}

// Author sidebar for a post row: avatar, display name, rank badge, OP badge and
// the meta list (message count, join date, location). Presentational only.
export default function UserCard({
  author,
  meta,
  isOp,
  strings,
}: {
  author: ForoPost['author']
  meta?: ForoPostAuthorMeta
  isOp: boolean
  strings: UserCardStrings
}) {
  const rank = userRank(meta?.postCount ?? 0, strings.rank)
  return (
    <aside className="flex w-full items-center gap-3 border-b border-neutral-100 bg-primary-50/40 p-4 sm:w-44 sm:shrink-0 sm:flex-col sm:items-center sm:border-r sm:border-b-0 sm:text-center dark:border-neutral-800 dark:bg-primary-900/10">
      <Link href={`/@${author.username}` as Route} className="shrink-0">
        <UserAvatar author={author} className="h-12 w-12 sm:h-20 sm:w-20" />
      </Link>
      <div className="min-w-0 flex-1 sm:flex-none">
        <Link
          href={`/@${author.username}` as Route}
          className="block truncate text-sm font-semibold text-primary-700 hover:underline dark:text-primary-400"
        >
          {author.displayName}
        </Link>
        <div className="mt-0.5 flex flex-wrap gap-1 sm:justify-center">
          <Badge color={rank.color}>{rank.label}</Badge>
          {isOp && <Badge color="green">{strings.opLabel}</Badge>}
        </div>
      </div>
      <dl className="hidden w-full space-y-0.5 pt-2 text-[11px] text-neutral-500 sm:block dark:text-neutral-400">
        <div>
          <dt className="inline font-semibold text-neutral-600 dark:text-neutral-300">
            {strings.messagesLabel}
          </dt>{' '}
          <dd className="inline">{meta?.postCount ?? 0}</dd>
        </div>
        {meta?.joinedAt && (
          <div>
            <dt className="inline font-semibold text-neutral-600 dark:text-neutral-300">
              {strings.memberLabel}
            </dt>{' '}
            <dd className="inline">{formatRelativeDate(meta.joinedAt)}</dd>
          </div>
        )}
        {meta?.location && (
          <div>
            <dt className="inline font-semibold text-neutral-600 dark:text-neutral-300">
              {strings.locationLabel}
            </dt>{' '}
            <dd className="inline truncate">{meta.location}</dd>
          </div>
        )}
      </dl>
    </aside>
  )
}
