import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import {
  getForumByslugInSpace,
  getSpaceBySlug,
  getSpaceOwnerBackLink,
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
  const t = await getTranslations('foro')

  const space = await getSpaceBySlug(spaceSlug)
  if (!space) notFound()
  const forum = await getForumByslugInSpace(space.id, forumSlug)
  if (!forum) notFound()
  const ownerBack = await getSpaceOwnerBackLink(space)

  const { stickies, regular, total } = await listTopicsPage(forum.id, {
    page,
    pageSize: PAGE_SIZE,
  })

  const basePath = `/foro/${space.slug}/${forum.slug}`
  const buildHref = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`)
  const totalWithStickies = total + stickies.length
  const totalLabel = totalWithStickies === 1 ? t('forum.topicOne') : t('forum.topicOther')

  const newTopicButton = (
    <Button
      href={`${basePath}/nuevo-tema` as Route}
      color="primary"
      className="w-full sm:w-auto"
    >
      <PlusIcon data-slot="icon" />
      {t('forum.newTopic')}
    </Button>
  )

  return (
    <div className="container mx-auto max-w-6xl space-y-4 px-4 py-4 sm:py-6">
      <ForoHeader
        title={forum.name}
        subtitle={forum.description ?? undefined}
        crumbs={[
          ...(ownerBack ? [{ href: ownerBack.href, label: `← ${ownerBack.label}` }] : []),
          { href: '/foro', label: t('crumbs.foros') },
          { href: `/foro/${space.slug}`, label: space.name },
        ]}
        action={newTopicButton}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <ForoPagination page={page} pageSize={PAGE_SIZE} total={total} buildHref={buildHref} />
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          <strong>{totalWithStickies}</strong> {totalLabel} {t('forum.totalSuffix')}
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
          {t('forum.permissionsTitle')}
        </p>
        <ul className="mt-1 grid grid-cols-1 gap-y-0.5 sm:grid-cols-2">
          <li>✓ {t('forum.permissions.post')}</li>
          <li>✓ {t('forum.permissions.reply')}</li>
          <li>✓ {t('forum.permissions.editOwn')}</li>
          <li>✓ {t('forum.permissions.deleteOwn')}</li>
        </ul>
      </section>
    </div>
  )
}
