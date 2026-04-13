import { listTimelinePosts } from '@/app/(app)/feed/post/server/posts.server'
import FeedPageClient from './FeedPageClient'

export default async function FeedPage() {
  const initialPosts = await listTimelinePosts(20)
  return <FeedPageClient initialPosts={initialPosts} />
}
