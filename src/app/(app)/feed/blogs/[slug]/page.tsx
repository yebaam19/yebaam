'use client'

import { BlogAboutSection } from '@/features/blogs/components/BlogAboutSection'
import { BlogMediaGrid } from '@/features/blogs/components/BlogMediaGrid'
import { BlogPostsList } from '@/features/blogs/components/BlogPostsList'
import { BlogTabs, TabType } from '@/features/blogs/components/BlogTabs'
import { BlogCoverBar } from '@/features/blogs/components/detail/BlogCoverBar'
import { BlogDetailsPanel } from '@/features/blogs/components/detail/BlogDetailsPanel'
import { BlogFeaturedPhotos } from '@/features/blogs/components/detail/BlogFeaturedPhotos'
import { BlogIdentityBar } from '@/features/blogs/components/detail/BlogIdentityBar'
import { BlogRecentStatesGrid } from '@/features/blogs/components/detail/BlogRecentStatesGrid'
import { BlogReel } from '@/features/blogs/components/detail/BlogReel'
import { BlogSideMenu, type BlogSideMenuItem } from '@/features/blogs/components/detail/BlogSideMenu'
import { EditBlogModal } from '@/features/blogs/components/EditBlogModal'
import { useBlogBySlug, useBlogPosts, useFollowBlog, useUnfollowBlog } from '@/features/blogs/hooks/useBlogs'
import { computeBlogStars } from '@/features/blogs/utils/rating'
import { PencilIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import { useParams } from 'next/navigation'
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

export default function BlogDetailPage() {
  const params = useParams()
  const slug = params.slug as string

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
      console.error('[BlogDetailPage] follow toggle error:', err)
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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="mx-auto max-w-7xl px-3 pt-4 pb-10 sm:px-6 lg:px-8">
        <BlogCoverBar
          blog={blog}
          stars={stars}
          onFollowToggle={handleFollowToggle}
          isFollowLoading={followMutation.isPending || unfollowMutation.isPending}
        />

        <div className="mt-4 flex flex-col gap-4 lg:flex-row">
          {/* Left vertical menu */}
          <BlogSideMenu stars={stars} onSelect={setOpenedMenu} />

          {/* Main column */}
          <div className="min-w-0 flex-1 space-y-6">
            <BlogIdentityBar blog={blog} stars={stars} />

            <div className="flex items-center justify-between gap-4">
              <BlogTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                photosCount={photosCount}
                videosCount={videosCount}
              />
              {blog.isOwner && (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="mt-1 mb-8 inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
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
              <BlogPostsList posts={postsList} blogId={blog.id} isOwner={!!blog.isOwner} />
            )}

            {activeTab === 'fotos' && <BlogMediaGrid posts={postsList} type="IMAGE" />}

            {activeTab === 'videos' && <BlogMediaGrid posts={postsList} type="VIDEO" />}
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
    </div>
  )
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

function MenuPanelBody({ item, blog }: { item: BlogSideMenuItem; blog: { owner?: { name?: string; username?: string } } }) {
  if (item === 'members') {
    return (
      <div className="text-sm text-neutral-600 dark:text-neutral-300">
        <p className="mb-3">
          Administrador:{' '}
          <span className="font-medium text-neutral-900 dark:text-white">
            {blog.owner?.name || 'Sin asignar'}
          </span>
        </p>
        <p className="text-neutral-500 dark:text-neutral-400">
          La lista completa de miembros y seguidores se mostrará aquí próximamente (paginada en lotes de 30 y con
          buscador).
        </p>
      </div>
    )
  }

  if (item === 'events') {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        El bloguero podrá crear o compartir eventos (en vivo o encuentros). Próximamente.
      </p>
    )
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
