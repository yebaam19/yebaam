'use client'

import { BlogAboutSection } from '@/features/blogs/components/BlogAboutSection'
import { BlogAskmeTab } from '@/features/blogs/components/BlogAskmeTab'
import { BlogForoTab } from '@/features/blogs/components/BlogForoTab'
import { BlogMediaGrid } from '@/features/blogs/components/BlogMediaGrid'
import { BlogMusicTab } from '@/features/blogs/components/BlogMusicTab'
import { BlogArticlesTab } from '@/features/blogs/components/BlogArticlesTab'
import { BlogPostsList } from '@/features/blogs/components/BlogPostsList'
import { BlogTabs, TabType } from '@/features/blogs/components/BlogTabs'
import { BlogDetailsPanel } from '@/features/blogs/components/detail/BlogDetailsPanel'
import { BlogFeaturedPhotos } from '@/features/blogs/components/detail/BlogFeaturedPhotos'
import { BlogIdentityBar } from '@/features/blogs/components/detail/BlogIdentityBar'
import { BlogRecentStatesGrid } from '@/features/blogs/components/detail/BlogRecentStatesGrid'
import { BlogReel } from '@/features/blogs/components/detail/BlogReel'
import { PencilIcon } from '@/components/icons/heroicons-shim'
import type { Blog } from '@/features/blogs/types/blog.types'
import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces'

interface BlogDetailTabsProps {
  blog: Blog
  posts: Post[]
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  photosCount: number
  videosCount: number
  stars: 0 | 1 | 2 | 3 | 4 | 5
  canPost: boolean
  onEdit: () => void
}

/** Main content column: identity bar, tab strip, owner edit button and the
 *  per-tab content panels. Parent owns `activeTab` and tab/edit callbacks. */
export function BlogDetailTabs({
  blog,
  posts,
  activeTab,
  onTabChange,
  photosCount,
  videosCount,
  stars,
  canPost,
  onEdit,
}: BlogDetailTabsProps) {
  return (
    <div className="min-w-0 flex-1 space-y-6">
      <BlogIdentityBar blog={blog} stars={stars} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <BlogTabs
            activeTab={activeTab}
            onTabChange={onTabChange}
            photosCount={photosCount}
            videosCount={videosCount}
          />
        </div>
        {blog.isOwner && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex shrink-0 items-center gap-1.5 self-end rounded-lg bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-200 sm:mb-4 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
          >
            <PencilIcon className="h-3.5 w-3.5" />
            Editar blog
          </button>
        )}
      </div>

      {activeTab === 'acerca-de' && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <BlogDetailsPanel blog={blog} />
            <BlogReel posts={posts} />
          </div>
          <BlogAboutSection blog={blog} />
          <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
            <BlogRecentStatesGrid posts={posts} />
            <BlogFeaturedPhotos posts={posts} />
          </div>
        </div>
      )}

      {activeTab === 'posts' && (
        <BlogPostsList
          posts={posts}
          blogId={blog.id}
          isOwner={!!blog.isOwner}
          canPost={canPost}
        />
      )}

      {activeTab === 'fotos' && <BlogMediaGrid posts={posts} type="IMAGE" />}

      {activeTab === 'videos' && <BlogMediaGrid posts={posts} type="VIDEO" />}

      {activeTab === 'mi-musica' && (
        <BlogMusicTab blogId={blog.id} isOwner={!!blog.isOwner} />
      )}

      {activeTab === 'articulos' && (
        <BlogArticlesTab blogId={blog.id} isOwner={!!blog.isOwner} />
      )}

      {activeTab === 'foro' && (
        <BlogForoTab
          blogId={blog.id}
          blogName={blog.name}
          isOwner={!!blog.isOwner}
        />
      )}

      {activeTab === 'askme' && (
        <BlogAskmeTab blogId={blog.id} blogName={blog.name} />
      )}
    </div>
  )
}
