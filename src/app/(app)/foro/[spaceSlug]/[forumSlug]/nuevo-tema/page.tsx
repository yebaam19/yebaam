import { notFound } from 'next/navigation'
import {
  getForumByslugInSpace,
  getSpaceBySlug,
  getSpaceOwnerBackLink,
} from '../../../server/foro.server'
import NewTopicForm from '@/features/foro/components/NewTopicForm'
import ForoHeader from '@/features/foro/components/ForoHeader'

interface PageProps {
  params: Promise<{ spaceSlug: string; forumSlug: string }>
}

export default async function NewTopicPage({ params }: PageProps) {
  const { spaceSlug, forumSlug } = await params
  const space = await getSpaceBySlug(spaceSlug)
  if (!space) notFound()
  const forum = await getForumByslugInSpace(space.id, forumSlug)
  if (!forum) notFound()
  const ownerBack = await getSpaceOwnerBackLink(space)

  return (
    <div className="container mx-auto max-w-3xl space-y-4 px-4 py-4 sm:py-6">
      <ForoHeader
        title="Nuevo tema"
        subtitle={`Publicando en ${forum.name}`}
        crumbs={[
          ...(ownerBack ? [{ href: ownerBack.href, label: `← ${ownerBack.label}` }] : []),
          { href: '/foro', label: 'Foros' },
          { href: `/foro/${space.slug}`, label: space.name },
          { href: `/foro/${space.slug}/${forum.slug}`, label: forum.name },
        ]}
      />
      <NewTopicForm
        spaceSlug={space.slug}
        forumId={forum.id}
        forumSlug={forum.slug}
        forumName={forum.name}
      />
    </div>
  )
}
