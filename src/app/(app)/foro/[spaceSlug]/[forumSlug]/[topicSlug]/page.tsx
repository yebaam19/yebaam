import { notFound, redirect } from 'next/navigation'
import type { Route } from 'next'
import {
  getSpaceBoard,
  getSpaceOwnerBackLink,
  getTopicBySlug,
  incrementTopicView,
  isSpaceModerator,
  listTopicPostsPage,
} from '../../../server/foro.server'
import TopicThread from '@/features/foro/components/TopicThread'
import { getServerClient } from '@/utils/supabase/server'

const PAGE_SIZE = 15

interface PageProps {
  params: Promise<{ spaceSlug: string; forumSlug: string; topicSlug: string }>
  searchParams: Promise<{ page?: string; p?: string }>
}

export default async function TopicPage({ params, searchParams }: PageProps) {
  const { spaceSlug, forumSlug, topicSlug } = await params
  const { page: pageParam, p: postParam } = await searchParams
  const result = await getTopicBySlug(spaceSlug, forumSlug, topicSlug)
  if (!result) notFound()

  // Jump-to-post: ?p=POST_ID should redirect to the right page.
  if (postParam) {
    const supabase = await getServerClient()
    const { data } = await supabase
      .from('forum_posts')
      .select('created_at')
      .eq('id', postParam)
      .eq('topic_id', result.topic.id)
      .maybeSingle()
    if (data) {
      const { count } = await supabase
        .from('forum_posts')
        .select('id', { count: 'exact', head: true })
        .eq('topic_id', result.topic.id)
        .lte('created_at', (data as { created_at: string }).created_at)
      const index = Math.max(0, (count ?? 1) - 1)
      const targetPage = Math.floor(index / PAGE_SIZE) + 1
      const base = `/foro/${spaceSlug}/${forumSlug}/${topicSlug}`
      const qs = targetPage > 1 ? `?page=${targetPage}#p${postParam}` : `#p${postParam}`
      redirect((base + qs) as Route)
    }
  }

  const page = Math.max(1, Number(pageParam) || 1)

  const [postsPage, isModerator, board, ownerBack] = await Promise.all([
    listTopicPostsPage(result.topic.id, { page, pageSize: PAGE_SIZE }),
    isSpaceModerator(result.space.id),
    getSpaceBoard(spaceSlug),
    getSpaceOwnerBackLink(result.space),
  ])

  // Increment view only on first page to avoid inflation.
  if (page === 1) {
    void incrementTopicView(result.topic.id)
  }

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
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <TopicThread
        space={result.space}
        forum={result.forum}
        topic={result.topic}
        initialPosts={postsPage.posts}
        isModerator={isModerator}
        spaceForums={allForums}
        page={postsPage.page}
        pageSize={postsPage.pageSize}
        totalPosts={postsPage.total}
        ownerBack={ownerBack}
      />
    </div>
  )
}
