import Link from 'next/link'
import type { Route } from 'next'
import { LockClosedIcon } from '@/components/icons/heroicons-shim'
import type { ForoTopic } from '@/features/foro/types'
import { formatRelativeDate } from '@/features/foro/utils/format'

interface Props {
  spaceSlug: string
  forumSlug: string
  stickies: ForoTopic[]
  topics: ForoTopic[]
}

function TopicRow({
  topic,
  spaceSlug,
  forumSlug,
}: {
  topic: ForoTopic
  spaceSlug: string
  forumSlug: string
}) {
  const replies = Math.max(topic.postCount - 1, 0)
  const href = `/foro/${spaceSlug}/${forumSlug}/${topic.slug}` as Route
  const lastPostHref = topic.lastPostId
    ? (`${href}?p=${topic.lastPostId}#p${topic.lastPostId}` as Route)
    : href

  return (
    <li className="grid grid-cols-12 items-center gap-4 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60">
      <div className="col-span-12 sm:col-span-7">
        <div className="flex items-center gap-2">
          {topic.isPinned && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase dark:bg-amber-900/40 dark:text-amber-300">
              Fijado
            </span>
          )}
          {topic.isLocked && <LockClosedIcon className="h-3.5 w-3.5 text-neutral-400" />}
          <Link
            href={href}
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
      <div className="col-span-4 text-center text-sm text-neutral-700 sm:col-span-1 dark:text-neutral-300">
        <div className="font-medium">{replies}</div>
        <div className="text-[10px] tracking-wide text-neutral-400 uppercase sm:hidden">
          Respuestas
        </div>
      </div>
      <div className="col-span-4 text-center text-sm text-neutral-700 sm:col-span-1 dark:text-neutral-300">
        <div className="font-medium">{topic.viewCount}</div>
        <div className="text-[10px] tracking-wide text-neutral-400 uppercase sm:hidden">
          Vistas
        </div>
      </div>
      <div className="col-span-4 text-right text-xs text-neutral-500 sm:col-span-3 dark:text-neutral-400">
        {topic.lastPostAt ? (
          <div className="flex items-center justify-end gap-2">
            <div>
              {topic.lastPostAuthor && (
                <div className="font-medium text-neutral-700 dark:text-neutral-300">
                  {topic.lastPostAuthor.displayName}
                </div>
              )}
              <div>« {formatRelativeDate(topic.lastPostAt)}</div>
            </div>
            <Link
              href={lastPostHref}
              aria-label="Ir al último mensaje"
              title="Ir al último mensaje"
              className="text-blue-500 hover:text-blue-700"
            >
              →
            </Link>
          </div>
        ) : (
          '—'
        )}
      </div>
    </li>
  )
}

export default function ForumTopicList({ spaceSlug, forumSlug, stickies, topics }: Props) {
  if (stickies.length === 0 && topics.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900">
        Aún no hay temas en este foro. ¡Sé el primero en publicar!
      </div>
    )
  }

  const Header = (
    <div className="hidden grid-cols-12 gap-4 border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase sm:grid dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
      <div className="col-span-7">Tema</div>
      <div className="col-span-1 text-center">Respuestas</div>
      <div className="col-span-1 text-center">Vistas</div>
      <div className="col-span-3 text-right">Último mensaje</div>
    </div>
  )

  return (
    <div className="space-y-4">
      {stickies.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 bg-amber-50 px-4 py-1.5 text-[11px] font-semibold tracking-wider text-amber-800 uppercase dark:border-neutral-800 dark:bg-amber-900/20 dark:text-amber-300">
            Anuncios / Fijados
          </div>
          {Header}
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {stickies.map((t) => (
              <TopicRow key={t.id} topic={t} spaceSlug={spaceSlug} forumSlug={forumSlug} />
            ))}
          </ul>
        </div>
      )}
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        {Header}
        {topics.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-neutral-500">
            No hay más temas en este foro.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {topics.map((t) => (
              <TopicRow key={t.id} topic={t} spaceSlug={spaceSlug} forumSlug={forumSlug} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
