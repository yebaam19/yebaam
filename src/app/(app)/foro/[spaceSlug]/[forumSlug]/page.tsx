import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import {
  getForumByslugInSpace,
  getSpaceBySlug,
  listTopicsPage,
} from '../../server/foro.server'
import ForumTopicList from '@/features/foro/components/ForumTopicList'
import ForoPagination from '@/features/foro/components/Pagination'

interface PageProps {
  params: Promise<{ spaceSlug: string; forumSlug: string }>
  searchParams: Promise<{ page?: string }>
}

const PAGE_SIZE = 25

export default async function ForumPage({ params, searchParams }: PageProps) {
  const { spaceSlug, forumSlug } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const space = await getSpaceBySlug(spaceSlug)
  if (!space) notFound()
  const forum = await getForumByslugInSpace(space.id, forumSlug)
  if (!forum) notFound()

  const { stickies, regular, total } = await listTopicsPage(forum.id, {
    page,
    pageSize: PAGE_SIZE,
  })

  const basePath = `/foro/${space.slug}/${forum.slug}`
  const buildHref = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`)
  const totalWithStickies = total + stickies.length

  const newTopicButton = (
    <Link
      href={`${basePath}/nuevo-tema` as Route}
      className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
    >
      Nuevo tema
    </Link>
  )

  return (
    <div className="container mx-auto max-w-5xl space-y-4 px-4 py-6">
      <nav className="text-xs text-neutral-500 dark:text-neutral-400">
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

      <header>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {forum.name}
        </h1>
        {forum.description && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{forum.description}</p>
        )}
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {newTopicButton}
        <ForoPagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          buildHref={buildHref}
        />
      </div>

      <ForumTopicList
        spaceSlug={space.slug}
        forumSlug={forum.slug}
        stickies={stickies}
        topics={regular}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
        {newTopicButton}
        <ForoPagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          buildHref={buildHref}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
        <span>
          <strong>{totalWithStickies}</strong> temas en total
        </span>
        <Link href={`/foro/${space.slug}` as Route} className="hover:text-blue-600">
          ← Volver al índice de «{space.name}»
        </Link>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 text-[11px] text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400">
        <p className="font-semibold text-neutral-600 dark:text-neutral-300">
          Permisos del foro
        </p>
        <ul className="mt-1 space-y-0.5">
          <li>Puedes publicar nuevos temas en este foro</li>
          <li>Puedes responder a los temas en este foro</li>
          <li>Puedes editar tus propios mensajes</li>
          <li>Puedes eliminar tus propios mensajes</li>
        </ul>
      </section>
    </div>
  )
}
