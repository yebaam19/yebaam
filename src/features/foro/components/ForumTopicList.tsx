import Link from 'next/link'
import type { Route } from 'next'
import { LockClosedIcon } from '@/components/icons/heroicons-shim'
import type { ForoTopic } from '@/features/foro/types'
import { formatRelativeDate } from '@/features/foro/utils/format'

interface Props {
  spaceSlug: string
  forumSlug: string
  topics: ForoTopic[]
}

export default function ForumTopicList({ spaceSlug, forumSlug, topics }: Props) {
  if (topics.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
        Aún no hay temas en este foro. ¡Sé el primero en publicar!
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="hidden grid-cols-12 gap-4 border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase sm:grid dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
        <div className="col-span-7">Tema</div>
        <div className="col-span-1 text-center">Resp.</div>
        <div className="col-span-4 text-right">Último mensaje</div>
      </div>
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {topics.map((topic) => (
          <li
            key={topic.id}
            className="grid grid-cols-12 items-center gap-4 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
          >
            <div className="col-span-12 sm:col-span-7">
              <div className="flex items-center gap-2">
                {topic.isPinned && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase dark:bg-amber-900/40 dark:text-amber-300">
                    Fijado
                  </span>
                )}
                {topic.isLocked && (
                  <LockClosedIcon className="h-3.5 w-3.5 text-neutral-400" />
                )}
                <Link
                  href={`/foro/${spaceSlug}/${forumSlug}/${topic.slug}` as Route}
                  className="truncate text-sm font-semibold text-neutral-900 hover:text-blue-600 dark:text-neutral-100 dark:hover:text-blue-400"
                >
                  {topic.title}
                </Link>
              </div>
              <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                por{' '}
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {topic.author.displayName}
                </span>
                {' · '}
                {formatRelativeDate(topic.createdAt)}
              </div>
            </div>
            <div className="col-span-2 text-center text-sm text-neutral-700 sm:col-span-1 dark:text-neutral-300">
              {Math.max(topic.postCount - 1, 0)}
            </div>
            <div className="col-span-10 text-right text-xs text-neutral-500 sm:col-span-4 dark:text-neutral-400">
              {topic.lastPostAt ? (
                <>
                  {topic.lastPostAuthor ? (
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {topic.lastPostAuthor.displayName}
                    </span>
                  ) : null}
                  <div>{formatRelativeDate(topic.lastPostAt)}</div>
                </>
              ) : (
                '—'
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
