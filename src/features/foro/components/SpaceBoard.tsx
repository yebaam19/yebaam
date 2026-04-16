import Link from 'next/link'
import type { Route } from 'next'
import { ChatBubbleLeftRightIcon } from '@/components/icons/heroicons-shim'
import type { ForoCategory, ForoForum, ForoSpace } from '@/features/foro/types'
import { formatRelativeDate } from '@/features/foro/utils/format'
import { Badge } from '@/ui/Badge'
import UserAvatar from './UserAvatar'

interface Props {
  space: ForoSpace
  categories: ForoCategory[]
}

function ForumRow({ space, forum }: { space: ForoSpace; forum: ForoForum }) {
  return (
    <li className="grid grid-cols-12 items-start gap-3 px-4 py-4 transition-colors hover:bg-primary-50/40 sm:items-center sm:gap-4 dark:hover:bg-primary-900/10">
      <div className="col-span-12 flex items-start gap-3 sm:col-span-6">
        <span
          aria-hidden
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <Link
            href={`/foro/${space.slug}/${forum.slug}` as Route}
            className="block truncate text-base font-semibold text-neutral-900 hover:text-primary-700 dark:text-neutral-100 dark:hover:text-primary-400"
          >
            {forum.name}
          </Link>
          {forum.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
              {forum.description}
            </p>
          )}
          {forum.subforums.length > 0 && (
            <p className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-xs text-neutral-500">
              <span className="font-medium text-neutral-600 dark:text-neutral-300">
                Subforos:
              </span>
              {forum.subforums.map((sf) => (
                <Link
                  key={sf.id}
                  href={`/foro/${space.slug}/${sf.slug}` as Route}
                  className="text-primary-700 hover:underline dark:text-primary-400"
                >
                  {sf.name}
                </Link>
              ))}
            </p>
          )}
        </div>
      </div>
      <div className="col-span-6 flex items-center gap-3 text-xs sm:col-span-2 sm:flex-col sm:items-center sm:gap-0.5 sm:text-center">
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
          {forum.topicCount}
        </span>
        <span className="text-neutral-500 dark:text-neutral-400">
          {forum.topicCount === 1 ? 'tema' : 'temas'}
        </span>
        <span className="mx-1 hidden sm:hidden">·</span>
        <span className="font-semibold text-neutral-900 sm:mt-1 dark:text-neutral-100">
          {forum.postCount}
        </span>
        <span className="text-neutral-500 dark:text-neutral-400">
          {forum.postCount === 1 ? 'mensaje' : 'mensajes'}
        </span>
      </div>
      <div className="col-span-12 sm:col-span-4 sm:text-right">
        {forum.lastPostAt && forum.lastTopicTitle && forum.lastTopicSlug ? (
          <div className="flex items-start gap-2 sm:justify-end">
            {forum.lastPostAuthor && (
              <UserAvatar
                author={forum.lastPostAuthor}
                className="h-8 w-8 shrink-0 sm:order-last"
              />
            )}
            <div className="min-w-0 text-xs text-neutral-500 dark:text-neutral-400">
              <Link
                href={`/foro/${space.slug}/${forum.slug}/${forum.lastTopicSlug}` as Route}
                className="block truncate font-medium text-neutral-800 hover:text-primary-700 dark:text-neutral-200 dark:hover:text-primary-400"
              >
                {forum.lastTopicTitle}
              </Link>
              <div className="mt-0.5 truncate">
                {forum.lastPostAuthor ? (
                  <>
                    por{' '}
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {forum.lastPostAuthor.displayName}
                    </span>{' '}
                    ·{' '}
                  </>
                ) : null}
                {formatRelativeDate(forum.lastPostAt)}
              </div>
            </div>
          </div>
        ) : (
          <Badge color="zinc">Sin mensajes</Badge>
        )}
      </div>
    </li>
  )
}

export default function SpaceBoard({ space, categories }: Props) {
  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
        Este foro todavía no tiene categorías.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <section
          key={cat.id}
          className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <header className="border-b border-neutral-200 bg-primary-600/10 px-4 py-2.5 dark:border-neutral-800 dark:bg-primary-900/20">
            <h2 className="text-xs font-bold tracking-wide text-primary-800 uppercase dark:text-primary-300">
              {cat.name}
            </h2>
          </header>
          {cat.forums.length === 0 ? (
            <p className="px-4 py-6 text-sm text-neutral-500">Sin foros todavía.</p>
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {cat.forums.map((forum) => (
                <ForumRow key={forum.id} space={space} forum={forum} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
