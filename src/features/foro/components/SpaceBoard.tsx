import Link from 'next/link'
import type { Route } from 'next'
import { ChatBubbleLeftRightIcon } from '@/components/icons/heroicons-shim'
import type { ForoCategory, ForoForum, ForoSpace } from '@/features/foro/types'
import { formatRelativeDate } from '@/features/foro/utils/format'

interface Props {
  space: ForoSpace
  categories: ForoCategory[]
}

function ForumRow({ space, forum }: { space: ForoSpace; forum: ForoForum }) {
  return (
    <li className="grid grid-cols-12 items-center gap-4 px-4 py-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60">
      <div className="col-span-12 flex items-start gap-3 sm:col-span-6">
        <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <Link
            href={`/foro/${space.slug}/${forum.slug}` as Route}
            className="block truncate text-base font-semibold text-neutral-900 hover:text-blue-600 dark:text-neutral-100 dark:hover:text-blue-400"
          >
            {forum.name}
          </Link>
          {forum.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
              {forum.description}
            </p>
          )}
          {forum.subforums.length > 0 && (
            <p className="mt-1 text-xs text-neutral-500">
              Subforos:{' '}
              {forum.subforums.map((sf, i) => (
                <span key={sf.id}>
                  <Link
                    href={`/foro/${space.slug}/${sf.slug}` as Route}
                    className="hover:text-blue-600"
                  >
                    {sf.name}
                  </Link>
                  {i < forum.subforums.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>
      <div className="col-span-4 hidden text-center text-sm text-neutral-600 sm:col-span-1 sm:block dark:text-neutral-400">
        <div className="font-semibold text-neutral-900 dark:text-neutral-100">
          {forum.topicCount}
        </div>
        <div className="text-xs">temas</div>
      </div>
      <div className="col-span-4 hidden text-center text-sm text-neutral-600 sm:col-span-1 sm:block dark:text-neutral-400">
        <div className="font-semibold text-neutral-900 dark:text-neutral-100">
          {forum.postCount}
        </div>
        <div className="text-xs">mensajes</div>
      </div>
      <div className="col-span-12 sm:col-span-4 sm:text-right">
        {forum.lastPostAt && forum.lastTopicTitle && forum.lastTopicSlug ? (
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            <Link
              href={`/foro/${space.slug}/${forum.slug}/${forum.lastTopicSlug}` as Route}
              className="block truncate font-medium text-neutral-800 hover:text-blue-600 dark:text-neutral-200 dark:hover:text-blue-400"
            >
              {forum.lastTopicTitle}
            </Link>
            <div className="mt-0.5">
              {forum.lastPostAuthor ? (
                <>
                  por{' '}
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">
                    {forum.lastPostAuthor.displayName}
                  </span>
                  {' · '}
                </>
              ) : null}
              {formatRelativeDate(forum.lastPostAt)}
            </div>
          </div>
        ) : (
          <span className="text-xs text-neutral-400">Sin mensajes</span>
        )}
      </div>
    </li>
  )
}

export default function SpaceBoard({ space, categories }: Props) {
  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
        Este foro todavía no tiene categorías.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <section
          key={cat.id}
          className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <header className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/60">
            <h2 className="text-sm font-semibold tracking-wide text-neutral-700 uppercase dark:text-neutral-200">
              {cat.name}
            </h2>
          </header>
          {cat.forums.length === 0 ? (
            <p className="px-4 py-6 text-sm text-neutral-500">Sin foros todavía.</p>
          ) : (
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
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
