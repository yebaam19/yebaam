'use client'

import LiveVideoModal from '@/app/(app)/feed/post/components/LiveVideoModal'
import { CreatePostCard } from '@/components/CreatePostCard'
import { Stories } from '@/components/Stories'
import { useAuth } from '@/features/auth'
import { VideoPlayerModal } from '@/features/live-stream'
import { CreatePostModal, EditPostModal, FeedTimeline, usePostStore } from '@/features/post'
import { FriendSuggestionsCompact } from '@/features/user/components/FriendSuggestionCard'
import { useState } from 'react'
import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces'

interface RecordedStream {
  id: string
  title: string
  description?: string
  playbackUrl?: string
  recordingUrl?: string
  author: {
    id: string
    username: string
    firstName: string
    lastName?: string
    avatar?: string
  }
  stats: {
    duration: number
    viewerCount: number
    peakViewerCount: number
    endedAt?: string
  }
  privacy: string
  createdAt: string
}

interface FeedPageClientProps {
  initialPosts: Post[]
}

export default function FeedPageClient({ initialPosts }: FeedPageClientProps) {
  const { user } = useAuth()
  const { openCreateModal } = usePostStore()
  const [isLiveVideoModalOpen, setIsLiveVideoModalOpen] = useState(false)
  const [isVideoPlayerModalOpen, setIsVideoPlayerModalOpen] = useState(false)
  const [selectedStream, setSelectedStream] = useState<RecordedStream | null>(null)

  const handleClosePlayer = () => {
    setIsVideoPlayerModalOpen(false)
    setSelectedStream(null)
  }

  if (!user) return null

  return (
    <div className="mx-auto w-full min-w-0 max-w-[min(590px,100%)] px-3 pt-3 pb-6 sm:px-5 sm:pt-5">
      <div className="space-y-3 sm:space-y-4">
        <Stories />
        <CreatePostModal />
        <EditPostModal />
        <LiveVideoModal isOpen={isLiveVideoModalOpen} onClose={() => setIsLiveVideoModalOpen(false)} />
        <VideoPlayerModal isOpen={isVideoPlayerModalOpen} onClose={handleClosePlayer} stream={selectedStream} />

        <CreatePostCard
          user={{
            avatar: user.avatar,
            username: user.username,
          }}
          onCreateClick={() => openCreateModal()}
          onLiveVideoClick={() => setIsLiveVideoModalOpen(true)}
        />

        <FeedTimeline initialPosts={initialPosts} />

        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <FriendSuggestionsCompact limit={4} />
        </div>

        <div className="flex items-center gap-4 py-4">
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
    </div>
  )
}
