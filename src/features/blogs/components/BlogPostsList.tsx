'use client'

import CreatePostModal from '@/app/(app)/feed/post/components/CreatePostModal'
import PostCard from '@/app/(app)/feed/post/components/PostCard'
import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces'
import { usePostStore } from '@/app/(app)/feed/post/stores/post.store'
import { PlusIcon } from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'

interface BlogPostsListProps {
  posts: Post[]
  isLoading?: boolean
  blogId?: string
  isOwner?: boolean
}

export const BlogPostsList = ({ posts, isLoading, blogId, isOwner }: BlogPostsListProps) => {
  const t = useTranslations('blogs.posts')
  const { openCreateModal } = usePostStore()

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-lg bg-white p-6 shadow-sm dark:bg-neutral-800">
            <div className="mb-2 h-6 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="mb-1 h-4 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        ))}
      </div>
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <>
        <div className="rounded-lg bg-white p-12 text-center shadow-sm dark:bg-neutral-800">
          <p className="mb-4 text-neutral-600 dark:text-neutral-400">{t('empty')}</p>
          {isOwner && blogId && (
            <button
              onClick={() => openCreateModal(blogId)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5" />
              {t('createFirst')}
            </button>
          )}
        </div>

        <CreatePostModal />
      </>
    )
  }

  return (
    <>
      {isOwner && blogId && (
        <div className="mb-6">
          <button
            onClick={() => openCreateModal(blogId)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 bg-white px-4 py-3 font-medium text-neutral-600 shadow-sm transition-shadow hover:border-primary-500 hover:text-primary-600 hover:shadow-md dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:border-primary-500 dark:hover:text-primary-500"
          >
            <PlusIcon className="h-5 w-5" />
            {t('createNew')}
          </button>
        </div>
      )}

      <div className="space-y-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <CreatePostModal />
    </>
  )
}
