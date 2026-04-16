import type { Route } from 'next'
import { notFound } from 'next/navigation'
import {
  getForumByslugInSpace,
  getSpaceBySlug,
  listTopicsPage,
} from '../../server/foro.server'
import ForumTopicList from '@/features/foro/components/ForumTopicList'
import ForoPagination from '@/features/foro/components/Pagination'
import ForoHeader from '@/features/foro/components/ForoHeader'
import { Button } from '@/ui/Button'
import { PlusIcon } from '@/components/icons/heroicons-shim'

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
    <Button
      href={`${basePath}/nuevo-tema` as Route}
      color="primary"
      className="w-full sm:w-auto"
    >
      <PlusIcon data-slot="icon" />
      Nuevo tema
    </Button>
  )

  return (
    <div className="container mx-auto max-w-6xl space-y-4 px-4 py-4 sm:py-6">
      <ForoHeader
        title={forum.name}
        subtitle={forum.description ?? undefined}
        crumbs={[
          { href: '/foro', label: 'Foros' },
          { href: `/foro/${space.slug}`, label: space.name },
        ]}
        action={newTopicButton}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <ForoPagination page={page} pageSize={PAGE_SIZE} total={total} buildHref={buildHref} />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          <strong>{totalWithStickies}</strong>{' '}
          {totalWithStickies === 1 ? 'tema' : 'temas'} en total
        </span>
      </div>

      <ForumTopicList
        spaceSlug={space.slug}
        forumSlug={forum.slug}
        stickies={stickies}
        topics={regular}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        {newTopicButton}
        <ForoPagination page={page} pageSize={PAGE_SIZE} total={total} buildHref={buildHref} />
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 text-[11px] text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
        <p className="font-semibold text-neutral-600 dark:text-neutral-300">
          Permisos del foro
        </p>
        <ul className="mt-1 grid grid-cols-1 gap-y-0.5 sm:grid-cols-2">
          <li>✓ Puedes publicar nuevos temas</li>
          <li>✓ Puedes responder a los temas</li>
          <li>✓ Puedes editar tus propios mensajes</li>
          <li>✓ Puedes eliminar tus propios mensajes</li>
        </ul>
      </section>
    </div>
  )
}
