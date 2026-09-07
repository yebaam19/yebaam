'use client'

import dynamic from 'next/dynamic'
import { CreatePostCard } from '@/components/CreatePostCard'
import FabComposer from '@/components/FabComposer'
import { Stories } from '@/components/Stories'
import { useAuth } from '@/features/auth'
import FeedTimeline from '@/app/(app)/feed/post/components/FeedTimeline'
import { usePostStore } from '@/app/(app)/feed/post/stores/post.store'
import { FriendSuggestionsCompact } from '@/features/user/components/FriendSuggestionCard'
import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces'

// Composer modals are heavy (uploader, media pipeline) — load them lazily and
// only when open so they stay out of the feed's first-paint JS.
const CreatePostModal = dynamic(() => import('@/app/(app)/feed/post/components/CreatePostModal'), {
  ssr: false,
})
const EditPostModal = dynamic(() => import('@/app/(app)/feed/post/components/EditPostModal'), {
  ssr: false,
})

interface FeedPageClientProps {
  initialPosts: Post[]
}

export default function FeedPageClient({ initialPosts }: FeedPageClientProps) {
  const { user } = useAuth()
  const openCreateModal = usePostStore((s) => s.openCreateModal)
  const isCreateModalOpen = usePostStore((s) => s.isCreateModalOpen)
  const isEditModalOpen = usePostStore((s) => s.isEditModalOpen)

  // The route is auth-gated by src/proxy.ts, so the feed shell renders
  // unconditionally; only user-specific pieces wait for the client auth store.
  return (
    <div className="mx-auto w-full min-w-0 max-w-[min(640px,100%)] px-3 pt-5 pb-8 sm:px-6 sm:pt-7">
      <div className="space-y-3 sm:space-y-4">
        <header className="relative overflow-hidden rounded-2xl border border-primary-200 bg-primary-50 px-5 py-5 dark:border-primary-900/70 dark:bg-primary-950/40 sm:px-6 sm:py-6">
          <div className="absolute -right-10 -top-12 size-32 rounded-full bg-secondary-300/40 blur-2xl dark:bg-secondary-700/20" />
          <div className="relative">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-primary-800 dark:text-primary-200">
              <span className="size-2 rounded-full bg-primary-600 shadow-[0_0_0_4px_rgba(67,175,100,0.16)] dark:bg-primary-400" />
              <span>Tu comunidad, hoy</span>
            </div>
            <h1 className="max-w-[26rem] text-2xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white sm:text-[2rem] sm:leading-tight">
              Ideas, historias y personas que te acercan.
            </h1>
            <p className="mt-2 max-w-[34rem] text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              Mira lo nuevo de tus conexiones y deja algo tuyo en la conversación.
            </p>
          </div>
        </header>

        <Stories />
        {isCreateModalOpen && <CreatePostModal />}
        {isEditModalOpen && <EditPostModal />}

        {user && (
          <CreatePostCard
            user={{
              avatar: user.avatar,
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
            }}
            onCreateClick={() => openCreateModal()}
          />
        )}

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
