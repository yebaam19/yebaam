import Link from 'next/link'
import type { Route } from 'next'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import type { ForoTopicAdminRow } from '@/app/(app)/foro/server/admin.server'
import { Badge } from '@/ui/Badge'
import UserAvatar from '@/features/foro/components/UserAvatar'
import { formatRelativeDate } from '@/features/foro/utils/format'

interface TopicRowProps {
  topic: ForoTopicAdminRow
  selected: boolean
  onToggle: (id: string) => void
}

export default function TopicRow({ topic: tp, selected: isSel, onToggle }: TopicRowProps) {
  const t = useTranslations('foro.admin.topics')
  const replies = Math.max(tp.postCount - 1, 0)

  return (
    <tr
      className={clsx(
        'transition-colors',
        isSel
          ? 'bg-primary-50/60 dark:bg-primary-900/20'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40',
      )}
    >
      <td className="px-3 py-3 align-top">
        <input
          type="checkbox"
          aria-label={t('table.selectAria', { title: tp.title })}
          checked={isSel}
          onChange={() => onToggle(tp.id)}
        />
      </td>
      <td className="min-w-0 px-3 py-3 align-top">
        <div className="flex items-start gap-2">
          <UserAvatar author={tp.author} className="h-7 w-7 shrink-0" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1">
              {tp.isPinned && <Badge color="amber">{t('table.pinned')}</Badge>}
              {tp.isLocked && <Badge color="zinc">{t('table.locked')}</Badge>}
              <Link
                href={`/foro/${tp.spaceSlug}/${tp.forumSlug}/${tp.slug}` as Route}
                className="truncate text-sm font-semibold text-neutral-900 hover:text-primary-700 dark:text-neutral-100 dark:hover:text-primary-400"
              >
                {tp.title}
              </Link>
            </div>
            <div className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
              {t('table.byAuthor')}{' '}
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {tp.author.displayName}
              </span>{' '}
              · {formatRelativeDate(tp.createdAt)}
            </div>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 align-top text-xs">
        <Link
          href={`/foro/${tp.spaceSlug}` as Route}
          className="block truncate font-medium text-neutral-700 hover:text-primary-700 dark:text-neutral-300 dark:hover:text-primary-400"
        >
          {tp.spaceName}
        </Link>
        <Link
          href={`/foro/${tp.spaceSlug}/${tp.forumSlug}` as Route}
          className="block truncate text-neutral-500 hover:text-primary-700 dark:text-neutral-400 dark:hover:text-primary-400"
        >
          {tp.forumName}
        </Link>
      </td>
      <td className="px-3 py-3 text-center align-top text-xs font-semibold text-neutral-700 dark:text-neutral-300">
        {replies}
      </td>
      <td className="px-3 py-3 text-center align-top text-xs font-semibold text-neutral-700 dark:text-neutral-300">
        {tp.viewCount}
      </td>
      <td className="px-3 py-3 text-right align-top text-xs text-neutral-500 dark:text-neutral-400">
        {tp.lastPostAt ? (
          <>
            {tp.lastPostAuthor && (
              <div className="truncate font-medium text-neutral-700 dark:text-neutral-300">
                {tp.lastPostAuthor.displayName}
              </div>
            )}
            <div>{formatRelativeDate(tp.lastPostAt)}</div>
          </>
        ) : (
          '—'
        )}
      </td>
    </tr>
  )
}
