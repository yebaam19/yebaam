'use client'

import { CreatePostCard } from '@/components/CreatePostCard'
import FabComposer from '@/components/FabComposer'
import { Stories } from '@/components/Stories'
import { useAuth } from '@/features/auth'
import { CreatePostModal, EditPostModal, FeedTimeline, usePostStore } from '@/features/post'
import { FriendSuggestionsCompact } from '@/features/user/components/FriendSuggestionCard'
import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces'

interface FeedPageClientProps {
  initialPosts: Post[]
}

export default function FeedPageClient({ initialPosts }: FeedPageClientProps) {
  const { user } = useAuth()
  const openCreateModal = usePostStore((s) => s.openCreateModal)

  if (!user) return null

  return (
    <div className="mx-auto w-full min-w-0 max-w-[min(590px,100%)] px-3 pt-3 pb-6 sm:px-5 sm:pt-5">
      <div className="space-y-3 sm:space-y-4">
        <Stories />
        <CreatePostModal />
        <EditPostModal />

        <CreatePostCard
          user={{
            avatar: user.avatar,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
          }}
          onCreateClick={() => openCreateModal()}
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

      <FabComposer onClick={() => openCreateModal()} />
    </div>
  )
}
