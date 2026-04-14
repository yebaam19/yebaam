import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import {
  getForumByslugInSpace,
  getSpaceBySlug,
  listTopics,
} from '../../server/foro.server'
import ForumTopicList from '@/features/foro/components/ForumTopicList'

interface PageProps {
  params: Promise<{ spaceSlug: string; forumSlug: string }>
}

export default async function ForumPage({ params }: PageProps) {
  const { spaceSlug, forumSlug } = await params
  const space = await getSpaceBySlug(spaceSlug)
  if (!space) notFound()
  const forum = await getForumByslugInSpace(space.id, forumSlug)
  if (!forum) notFound()
  const topics = await listTopics(forum.id, { limit: 50 })

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <nav className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
        <Link href="/foro" className="hover:text-blue-600">
          Foros
        </Link>
        {' › '}
        <Link href={`/foro/${space.slug}` as Route} className="hover:text-blue-600">
          {space.name}
        </Link>
        {' › '}
        <span className="text-neutral-700 dark:text-neutral-300">{forum.name}</span>
      </nav>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {forum.name}
          </h1>
          {forum.description && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{forum.description}</p>
          )}
        </div>
        <Link
          href={`/foro/${space.slug}/${forum.slug}/nuevo-tema` as Route}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          Nuevo tema
        </Link>
      </header>

      <ForumTopicList spaceSlug={space.slug} forumSlug={forum.slug} topics={topics} />
    </div>
  )
}
