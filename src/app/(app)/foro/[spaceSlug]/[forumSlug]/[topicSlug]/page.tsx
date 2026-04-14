import { notFound } from 'next/navigation'
import {
  getSpaceBoard,
  getTopicBySlug,
  isSpaceModerator,
  listPosts,
} from '../../../server/foro.server'
import TopicThread from '@/features/foro/components/TopicThread'

interface PageProps {
  params: Promise<{ spaceSlug: string; forumSlug: string; topicSlug: string }>
}

export default async function TopicPage({ params }: PageProps) {
  const { spaceSlug, forumSlug, topicSlug } = await params
  const result = await getTopicBySlug(spaceSlug, forumSlug, topicSlug)
  if (!result) notFound()

  const [posts, isModerator, board] = await Promise.all([
    listPosts(result.topic.id, { limit: 100 }),
    isSpaceModerator(result.space.id),
    getSpaceBoard(spaceSlug),
  ])

  // Flatten all forums in the space for the Move dialog
  const allForums = (() => {
    if (!board) return []
    const out: { id: string; name: string }[] = []
    for (const cat of board.categories) {
      for (const f of cat.forums) {
        out.push({ id: f.id, name: `${cat.name} / ${f.name}` })
        for (const sf of f.subforums) {
          out.push({ id: sf.id, name: `${cat.name} / ${f.name} / ${sf.name}` })
        }
      }
    }
    return out
  })()

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <TopicThread
        space={result.space}
        forum={result.forum}
        topic={result.topic}
        initialPosts={posts}
        isModerator={isModerator}
        spaceForums={allForums}
      />
    </div>
  )
}
