import Link from 'next/link'
import type { Route } from 'next'
import { getTranslations } from 'next-intl/server'
import { LockClosedIcon, ArrowRightIcon } from '@/components/icons/heroicons-shim'
import type { ForoTopic } from '@/features/foro/types'
import { formatRelativeDate } from '@/features/foro/utils/format'
import { Badge } from '@/ui/Badge'
import UserAvatar from './UserAvatar'

interface Props {
  spaceSlug: string
  forumSlug: string
  stickies: ForoTopic[]
  topics: ForoTopic[]
}

type RowStrings = {
  pinned: string
  lockedAriaLabel: string
  lockedTitle: string
  byAuthor: string
  shortReplies: string
  shortViews: string
  goToLastPost: string
  noReplies: string
}

function TopicRow({
  topic,
  spaceSlug,
  forumSlug,
  strings,
}: {
  topic: ForoTopic
  spaceSlug: string
  forumSlug: string
  strings: RowStrings
}) {
  const replies = Math.max(topic.postCount - 1, 0)
  const href = `/foro/${spaceSlug}/${forumSlug}/${topic.slug}` as Route
  const lastPostHref = topic.lastPostId
    ? (`${href}?p=${topic.lastPostId}#p${topic.lastPostId}` as Route)
    : href

  return (
    <li className="grid grid-cols-12 items-start gap-3 px-4 py-4 transition-colors hover:bg-primary-50/40 sm:items-center sm:gap-4 dark:hover:bg-primary-900/10">
      <div className="col-span-12 flex items-start gap-3 sm:col-span-7">
        <UserAvatar author={topic.author} className="h-9 w-9 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {topic.isPinned && <Badge color="amber">{strings.pinned}</Badge>}
            {topic.isLocked && (
              <span
                aria-label={strings.lockedAriaLabel}
                title={strings.lockedTitle}
                className="inline-flex h-5 items-center text-neutral-400"
              >
                <LockClosedIcon className="h-3.5 w-3.5" />
              </span>
            )}
            <Link
              href={href}
              className="min-w-0 truncate text-sm font-semibold text-neutral-900 hover:text-primary-700 dark:text-neutral-100 dark:hover:text-primary-400"
            >
              {topic.title}
            </Link>
          </div>
          <div className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
            {strings.byAuthor}{' '}
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {topic.author.displayName}
            </span>{' '}
            · {formatRelativeDate(topic.createdAt)}
          </div>
        </div>
      </div>
      <div className="col-span-4 flex items-baseline gap-1 text-sm sm:col-span-1 sm:flex-col sm:items-center sm:gap-0 sm:text-center">
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{replies}</span>
        <span className="text-[11px] text-neutral-500 uppercase dark:text-neutral-400">
          {strings.shortReplies}
        </span>
      </div>
      <div className="col-span-4 flex items-baseline gap-1 text-sm sm:col-span-1 sm:flex-col sm:items-center sm:gap-0 sm:text-center">
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {topic.viewCount}
        </span>
        <span className="text-[11px] text-neutral-500 uppercase dark:text-neutral-400">
          {strings.shortViews}
        </span>
      </div>
      <div className="col-span-4 text-right sm:col-span-3">
        {topic.lastPostAt ? (
          <div className="flex items-start justify-end gap-2">
            {topic.lastPostAuthor && (
              <UserAvatar
                author={topic.lastPostAuthor}
                className="hidden h-7 w-7 shrink-0 sm:block"
              />
            )}
            <div className="min-w-0 text-xs text-neutral-500 dark:text-neutral-400">
              {topic.lastPostAuthor && (
                <div className="truncate font-medium text-neutral-700 dark:text-neutral-300">
                  {topic.lastPostAuthor.displayName}
                </div>
              )}
              <div>{formatRelativeDate(topic.lastPostAt)}</div>
            </div>
            <Link
              href={lastPostHref}
              aria-label={strings.goToLastPost}
              title={strings.goToLastPost}
              className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary-600 hover:bg-primary-100 hover:text-primary-800 dark:text-primary-400 dark:hover:bg-primary-900/40"
            >
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <Badge color="zinc">{strings.noReplies}</Badge>
        )}
      </div>
    </li>
  )
}

export default async function ForumTopicList({ spaceSlug, forumSlug, stickies, topics }: Props) {
  const t = await getTranslations('foro')
  const strings: RowStrings = {
    pinned: t('forum.list.pinned'),
    lockedAriaLabel: t('forum.list.lockedAriaLabel'),
    lockedTitle: t('forum.list.lockedTitle'),
    byAuthor: t('forum.list.byAuthor'),
    shortReplies: t('forum.list.shortReplies'),
    shortViews: t('forum.list.shortViews'),
    goToLastPost: t('forum.list.goToLastPost'),
    noReplies: t('forum.list.noReplies'),
  }

  if (stickies.length === 0 && topics.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
        {t('forum.emptyTopics')}
      </div>
    )
  }

  const Header = (
    <div className="hidden grid-cols-12 gap-4 border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-[11px] font-bold tracking-wide text-neutral-500 uppercase sm:grid dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
      <div className="col-span-7">{t('forum.list.headerTopic')}</div>
      <div className="col-span-1 text-center">{t('forum.list.headerReplies')}</div>
      <div className="col-span-1 text-center">{t('forum.list.headerViews')}</div>
      <div className="col-span-3 text-right">{t('forum.list.headerLastPost')}</div>
    </div>
  )

  return (
    <div className="space-y-4">
      {stickies.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm dark:border-amber-900/60 dark:bg-neutral-900">
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-[11px] font-bold tracking-wider text-amber-800 uppercase dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300">
            {t('forum.list.announcements')}
          </div>
          {Header}
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {stickies.map((tp) => (
              <TopicRow key={tp.id} topic={tp} spaceSlug={spaceSlug} forumSlug={forumSlug} strings={strings} />
            ))}
          </ul>
        </section>
      )}
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {Header}
        {topics.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-neutral-500">
            {t('forum.noMoreTopics')}
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {topics.map((tp) => (
              <TopicRow key={tp.id} topic={tp} spaceSlug={spaceSlug} forumSlug={forumSlug} strings={strings} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
