import { Suspense } from 'react'
import { listTimelinePosts } from '@/app/(app)/feed/post/server/posts.server'
import FeedTimeline from '@/app/(app)/feed/post/components/FeedTimeline'
import FeedTimelineSkeleton from '@/app/(app)/feed/post/components/FeedTimelineSkeleton'
import FeedPageClient from './FeedPageClient'

async function Timeline() {
  const initialPosts = await listTimelinePosts(20)
  return <FeedTimeline initialPosts={initialPosts} />
}

export default function FeedPage() {
  return (
    <FeedPageClient timeline={
      <Suspense fallback={<FeedTimelineSkeleton />}>
        <Timeline />
      </Suspense>
    } />
  )
}
