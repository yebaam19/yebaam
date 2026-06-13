'use client'

import { type TabType } from '@/features/blogs/components/BlogTabs'
import { BlogDetailHero } from '@/features/blogs/components/BlogDetailView/BlogDetailHero'
import { BlogDetailTabs } from '@/features/blogs/components/BlogDetailView/BlogDetailTabs'
import { BlogDetailSideMenu } from '@/features/blogs/components/BlogDetailView/BlogDetailSideMenu'
import { type BlogSideMenuItem } from '@/features/blogs/components/detail/BlogSideMenu'
import { EditBlogModal } from '@/features/blogs/components/EditBlogModal'
import { useBlogBySlug, useBlogPosts, useFollowBlog, useUnfollowBlog } from '@/features/blogs/hooks/useBlogs'
import { useAuth } from '@/features/auth/context/auth-context'
import { ensureBlogChatTopicAction } from '@/features/chat-publico/actions/chat-publico.actions'
import { computeBlogStars } from '@/features/blogs/utils/rating'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { useMemo, useState } from 'react'

interface BlogDetailViewProps {
  /** Blog slug to load. Passed by the route page so this component is mount-agnostic. */
  slug: string
  /** When true (e.g. inside the /musica shell), drop the full-bleed
   *  `min-h-screen` background wrapper so it doesn't double-wrap the parent
   *  layout. The /feed mount keeps the standalone wrapper. */
  embedded?: boolean
}

export function BlogDetailView({ slug, embedded = false }: BlogDetailViewProps) {
  const router = useRouter()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<TabType>('acerca-de')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [openedMenu, setOpenedMenu] = useState<BlogSideMenuItem | null>(null)

  const { data: blog, isLoading, error, refetch } = useBlogBySlug(slug)
  const { data: posts } = useBlogPosts(blog?.id || '', 1, 20)
  const followMutation = useFollowBlog()
  const unfollowMutation = useUnfollowBlog()

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

  const stars = useMemo(() => {
    if (!blog) return 0 as const
    return computeBlogStars({ stats: blog.stats, photosCount, videosCount })
  }, [blog, photosCount, videosCount])

  const handleFollowToggle = async () => {
    if (!blog) return
    try {
      if (blog.isFollowing) {
        await unfollowMutation.mutateAsync(blog.id)
      } else {
        await followMutation.mutateAsync(blog.id)
      }
    } catch (err) {
      console.error('[BlogDetailView] follow toggle error:', err)
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

  if (error || !blog?.id) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-neutral-900 dark:text-white">Blog no encontrado</h2>
          <p className="text-neutral-600 dark:text-neutral-400">El blog que buscas no existe o ha sido eliminado</p>
        </div>
      </div>
    )
  }

  const postsList = posts || []

  const handleMenuSelect = async (item: BlogSideMenuItem) => {
    if (item === 'foro') {
      setActiveTab('foro')
      return
    }
    if (item === 'askme') {
      setActiveTab('askme')
      return
    }
    if (item === 'chat') {
      if (blog.isOwner) {
        const result = await ensureBlogChatTopicAction({
          id: blog.id,
          name: blog.name,
          slug: blog.slug,
          ownerId: blog.owner.id,
        })
        if (result?.topicSlug) {
          router.push(`/feed/chat-publico/${result.topicSlug}` as Route)
          return
        }
      }
      const fallbackSlug = `blog-${blog.slug}`
      router.push(`/feed/chat-publico/${fallbackSlug}` as Route)
      return
    }
    setOpenedMenu(item)
  }

  const content = (
    <>
      <div className="mx-auto max-w-7xl px-3 pt-4 pb-10 sm:px-6 lg:px-8">
        <BlogDetailHero
          blog={blog}
          stars={stars}
          onFollowToggle={handleFollowToggle}
          isFollowLoading={followMutation.isPending || unfollowMutation.isPending}
        />

        <div className="mt-4 flex flex-col gap-4 lg:flex-row">
          {/* Left vertical menu */}
          <BlogDetailSideMenu
            blog={blog}
            openedMenu={openedMenu}
            onSelect={handleMenuSelect}
            onCloseMenu={() => setOpenedMenu(null)}
          />

          {/* Main column */}
          <BlogDetailTabs
            blog={blog}
            posts={postsList}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            photosCount={photosCount}
            videosCount={videosCount}
            stars={stars}
            canPost={!!user}
            onEdit={() => setIsEditModalOpen(true)}
          />
        </div>
      </div>

      {blog && (
        <EditBlogModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          blog={blog}
          onSuccess={() => refetch()}
        />
      )}
    </>
  )

  if (embedded) return content

  return <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">{content}</div>
}
