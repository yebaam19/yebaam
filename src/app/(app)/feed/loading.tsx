import FeedTimelineSkeleton from './post/components/FeedTimelineSkeleton'

// Enables the login prefetch to prepare the authenticated layout while the
// browser reads the profile; timeline data can stream after navigation.
export default function Loading() {
  return <FeedTimelineSkeleton />
}
