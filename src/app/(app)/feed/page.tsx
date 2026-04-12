'use client'

import LiveVideoModal from '@/app/(app)/feed/post/components/LiveVideoModal'
import { CreatePostCard } from '@/components/CreatePostCard'
import { Stories } from '@/components/Stories'
import { useAuth } from '@/features/auth'
import { VideoPlayerModal } from '@/features/live-stream'
import { CreatePostModal, EditPostModal, FeedTimeline, usePostStore } from '@/features/post'
import { FriendSuggestionsCompact } from '@/features/user/components/FriendSuggestionCard'
import { useState } from 'react'

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

export default function FeedPage() {
  const { user } = useAuth()
  const { openCreateModal } = usePostStore()
  const [isLiveVideoModalOpen, setIsLiveVideoModalOpen] = useState(false)
  const [isVideoPlayerModalOpen, setIsVideoPlayerModalOpen] = useState(false)
  const [selectedStream, setSelectedStream] = useState<RecordedStream | null>(null)

  const handlePlayStream = (stream: RecordedStream) => {
    setSelectedStream(stream)
    setIsVideoPlayerModalOpen(true)
  }

  const handleClosePlayer = () => {
    setIsVideoPlayerModalOpen(false)
    setSelectedStream(null)
  }

  if (!user) return null

  return (
    <div className="mx-auto w-full max-w-[590px] p-5">
      <div className="space-y-3">
        {/* Stories Section */}
        <Stories />
        {/* Create Post Modal */}
        <CreatePostModal />

        {/* Edit Post Modal */}
        <EditPostModal />

        {/* Live Video Modal */}
        <LiveVideoModal isOpen={isLiveVideoModalOpen} onClose={() => setIsLiveVideoModalOpen(false)} />

        {/* Video Player Modal */}
        <VideoPlayerModal isOpen={isVideoPlayerModalOpen} onClose={handleClosePlayer} stream={selectedStream} />

        {/* Create Post Card */}
        <CreatePostCard
          user={{
            avatar: user.avatar,
            username: user.username,
          }}
          onCreateClick={() => openCreateModal()}
          onLiveVideoClick={() => setIsLiveVideoModalOpen(true)}
        />

        {/* Active Live Streams Bar
        <ActiveStreamsBar /> */}

        {/* Feed Timeline - Posts propios + amigos + públicos */}
        <FeedTimeline />

        {/* Recorded Streams Gallery 
        <RecordedStreamsGallery onPlayStream={handlePlayStream} />*/}

        {/* Sugerencias de Amigos */}
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <FriendSuggestionsCompact limit={4} />
        </div>

        {/* Divisor */}
        <div className="flex items-center gap-4 py-4">
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
    </div>
  )
}
