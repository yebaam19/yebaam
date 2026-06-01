'use client'

import { BlogAboutSection } from '@/features/blogs/components/BlogAboutSection'
import { BlogAskmeTab } from '@/features/blogs/components/BlogAskmeTab'
import { BlogForoTab } from '@/features/blogs/components/BlogForoTab'
import { BlogMediaGrid } from '@/features/blogs/components/BlogMediaGrid'
import { BlogMusicTab } from '@/features/blogs/components/BlogMusicTab'
import { BlogArticlesTab } from '@/features/blogs/components/BlogArticlesTab'
import { BlogPostsList } from '@/features/blogs/components/BlogPostsList'
import { BlogTabs, TabType } from '@/features/blogs/components/BlogTabs'
import { BlogCoverBar } from '@/features/blogs/components/detail/BlogCoverBar'
import { BlogDetailsPanel } from '@/features/blogs/components/detail/BlogDetailsPanel'
import { BlogFeaturedPhotos } from '@/features/blogs/components/detail/BlogFeaturedPhotos'
import { BlogIdentityBar } from '@/features/blogs/components/detail/BlogIdentityBar'
import { BlogRecentStatesGrid } from '@/features/blogs/components/detail/BlogRecentStatesGrid'
import { BlogReel } from '@/features/blogs/components/detail/BlogReel'
import { BlogMembersPanel } from '@/features/blogs/components/detail/BlogMembersPanel'
import { BlogEventsPanel } from '@/features/blogs/components/detail/BlogEventsPanel'
import { BlogSideMenu, type BlogSideMenuItem } from '@/features/blogs/components/detail/BlogSideMenu'
import { EditBlogModal } from '@/features/blogs/components/EditBlogModal'
import { useBlogBySlug, useBlogPosts, useFollowBlog, useUnfollowBlog } from '@/features/blogs/hooks/useBlogs'
import { useAuth } from '@/features/auth/context/auth-context'
import { ensureBlogChatTopicAction } from '@/features/chat-publico/actions/chat-publico.actions'
import { computeBlogStars } from '@/features/blogs/utils/rating'
import { PencilIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import type { Blog } from '@/features/blogs/types/blog.types'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { useMemo, useState } from 'react'

const MENU_LABELS: Record<BlogSideMenuItem, string> = {
  chat: 'Chat Público',
  members: 'Miembros y Seguidores',
  askme: 'Askme',
  foro: 'Foro',
  events: 'Eventos',
  promotions: 'Promociones',
  related: 'Páginas Relacionadas',
}

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

  const content = (
    <>
      <div className="mx-auto max-w-7xl px-3 pt-4 pb-10 sm:px-6 lg:px-8">
        <BlogCoverBar
          blog={blog}
          stars={stars}
          onFollowToggle={handleFollowToggle}
          isFollowLoading={followMutation.isPending || unfollowMutation.isPending}
        />

        <div className="mt-4 flex flex-col gap-4 lg:flex-row">
          {/* Left vertical menu */}
          <BlogSideMenu
            followersCount={blog.stats?.followersCount ?? 0}
            isOwner={!!blog.isOwner}
            onSelect={async (item) => {
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
            }}
          />

          {/* Main column */}
          <div className="min-w-0 flex-1 space-y-6">
            <BlogIdentityBar blog={blog} stars={stars} />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1">
                <BlogTabs
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  photosCount={photosCount}
                  videosCount={videosCount}
                />
              </div>
              {blog.isOwner && (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
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
                  <BlogReel posts={postsList} />
                </div>
                <BlogAboutSection blog={blog} />
                <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
                  <BlogRecentStatesGrid posts={postsList} />
                  <BlogFeaturedPhotos posts={postsList} />
                </div>
              </div>
            )}

            {activeTab === 'posts' && (
              <BlogPostsList
                posts={postsList}
                blogId={blog.id}
                isOwner={!!blog.isOwner}
                canPost={!!user}
              />
            )}

            {activeTab === 'fotos' && <BlogMediaGrid posts={postsList} type="IMAGE" />}

            {activeTab === 'videos' && <BlogMediaGrid posts={postsList} type="VIDEO" />}

            {activeTab === 'mi-musica' && (
              <BlogMusicTab blogId={blog.id} isOwner={!!blog.isOwner} />
            )}

            {activeTab === 'articulos' && (
              <BlogArticlesTab blogId={blog.id} isOwner={!!blog.isOwner} />
            )}

            {activeTab === 'foro' && (
              <BlogForoTab
                blogId={blog.id}
                blogSlug={blog.slug}
                blogName={blog.name}
                blogOwnerId={blog.owner.id}
                isOwner={!!blog.isOwner}
              />
            )}

            {activeTab === 'askme' && (
              <BlogAskmeTab blogId={blog.id} blogName={blog.name} />
            )}
          </div>
        </div>
      </div>

      {openedMenu && (
        <MenuPanel title={MENU_LABELS[openedMenu]} onClose={() => setOpenedMenu(null)}>
          <MenuPanelBody item={openedMenu} blog={blog} />
        </MenuPanel>
      )}

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

function MenuPanel({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg dark:bg-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function MenuPanelBody({ item, blog }: { item: BlogSideMenuItem; blog: Blog }) {
  if (item === 'members') {
    return <BlogMembersPanel blogId={blog.id} />
  }

  if (item === 'events') {
    return <BlogEventsPanel blogId={blog.id} isOwner={!!blog.isOwner} />
  }

  if (item === 'related') {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Aún no se han añadido páginas relacionadas. El bloguero podrá enlazar páginas internas y externas.
      </p>
    )
  }

  return null
}
