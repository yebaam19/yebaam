import { Suspense } from 'react'
import { listTimelinePage } from '@/app/(app)/feed/post/server/posts.server'
import FeedTimeline from '@/app/(app)/feed/post/components/FeedTimeline'
import FeedTimelineSkeleton from '@/app/(app)/feed/post/components/FeedTimelineSkeleton'
import FeedPageClient from './FeedPageClient'

async function Timeline() {
  const initialPage = await listTimelinePage()
  return <FeedTimeline initialPage={initialPage} />
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
