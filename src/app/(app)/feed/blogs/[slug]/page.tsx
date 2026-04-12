'use client'

import { BlogAboutSection } from '@/features/blogs/components/BlogAboutSection'
import { BlogHeader } from '@/features/blogs/components/BlogHeader'
import { BlogMediaGrid } from '@/features/blogs/components/BlogMediaGrid'
import { BlogPostsList } from '@/features/blogs/components/BlogPostsList'
import { BlogStats } from '@/features/blogs/components/BlogStats'
import { BlogTabs, TabType } from '@/features/blogs/components/BlogTabs'
import { EditBlogModal } from '@/features/blogs/components/EditBlogModal'
import { useBlogBySlug, useBlogPosts, useFollowBlog, useUnfollowBlog } from '@/features/blogs/hooks/useBlogs'
import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'

export default function BlogDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [activeTab, setActiveTab] = useState<TabType>('posts')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const { data: blog, isLoading, error, refetch } = useBlogBySlug(slug)
  const { data: posts } = useBlogPosts(blog?.id || '', 1, 10)
  const followMutation = useFollowBlog()
  const unfollowMutation = useUnfollowBlog()

  // Calcular conteos de fotos y videos
  const { photosCount, videosCount } = useMemo(() => {
    if (!posts) return { photosCount: 0, videosCount: 0 }

    let photos = 0
    let videos = 0

    posts.forEach((post) => {
      ;(post.mediaFiles || []).forEach((media) => {
        const mediaType = media.type?.toUpperCase()
        if (mediaType === 'IMAGE') photos++
        if (mediaType === 'VIDEO') videos++
      })
    })

    return { photosCount: photos, videosCount: videos }
  }, [posts])

  const handleFollowToggle = async () => {
    if (!blog) {
      return
    }

    try {
      if (blog.isFollowing) {
        await unfollowMutation.mutateAsync(blog.id)
      } else {
        await followMutation.mutateAsync(blog.id)
      }
    } catch (error) {
      console.error('[BlogDetailPage] Error en handleFollowToggle:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="mb-8 h-64 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
          <div className="mb-4 h-8 w-1/3 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">Blog no encontrado</h2>
          <p className="text-neutral-600 dark:text-neutral-400">El blog que buscas no existe o ha sido eliminado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header con Cover + Info + Botones */}
      <BlogHeader
        blog={blog}
        onEdit={() => setIsEditModalOpen(true)}
        onFollowToggle={handleFollowToggle}
        isFollowLoading={followMutation.isPending || unfollowMutation.isPending}
      />

      {/* Stats */}
      <div className="mx-auto mt-4 max-w-6xl px-4 sm:px-6 lg:px-8">
        <BlogStats
          followersCount={blog.stats.followersCount}
          postsCount={blog.stats.postsCount}
          totalViews={blog.stats.totalViews}
        />
      </div>

      {/* Tabs */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <BlogTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          photosCount={photosCount}
          videosCount={videosCount}
        />

        {/* Content */}
        <div className="pb-12">
          {activeTab === 'posts' && <BlogPostsList posts={posts || []} blogId={blog.id} isOwner={blog.isOwner} />}

          {activeTab === 'fotos' && <BlogMediaGrid posts={posts || []} type="IMAGE" />}

          {activeTab === 'videos' && <BlogMediaGrid posts={posts || []} type="VIDEO" />}

          {activeTab === 'acerca-de' && <BlogAboutSection blog={blog} />}
        </div>
      </div>

      {/* Edit Modal */}
      {blog && (
        <EditBlogModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          blog={blog}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  )
}
