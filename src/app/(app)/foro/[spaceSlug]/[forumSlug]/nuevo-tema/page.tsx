import { notFound } from 'next/navigation'
import { getForumByslugInSpace, getSpaceBySlug } from '../../../server/foro.server'
import NewTopicForm from '@/features/foro/components/NewTopicForm'

interface PageProps {
  params: Promise<{ spaceSlug: string; forumSlug: string }>
}

export default async function NewTopicPage({ params }: PageProps) {
  const { spaceSlug, forumSlug } = await params
  const space = await getSpaceBySlug(spaceSlug)
  if (!space) notFound()
  const forum = await getForumByslugInSpace(space.id, forumSlug)
  if (!forum) notFound()

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <NewTopicForm
        spaceSlug={space.slug}
        forumId={forum.id}
        forumSlug={forum.slug}
        forumName={forum.name}
      />
    </div>
  )
}
