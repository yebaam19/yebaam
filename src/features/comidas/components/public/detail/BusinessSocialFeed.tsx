'use client'

import { useEffect } from 'react'
import { PostCard } from '@/features/post'
import { usePostStore } from '@/app/(app)/feed/post/stores/post.store'
import { useBusinessPosts } from '@/app/(app)/feed/post/hooks/usePosts'

interface Props {
  businessId: string
  onCountLoaded?: (n: number) => void
  /** When set, renders an admin empty state with a publish CTA */
  adminBusinessId?: string
}

/**
 * Reads through the same cache-store mechanism as the global feed
 * (useFetch/cacheStore). createPost (mutations.slice.ts) mirrors new posts
 * into this exact cache entry, so this component re-renders immediately
 * after a post is published from the admin panel — no independent fetch,
 * no separate source of truth (fixes PRA-002).
 */
export function BusinessSocialFeed({ businessId, onCountLoaded, adminBusinessId }: Props) {
  const openCreateModal = usePostStore((s) => s.openCreateModal)
  const { data, isLoading, error } = useBusinessPosts(businessId)
  const posts = data ?? []

  useEffect(() => {
    if (!isLoading) onCountLoaded?.(posts.length)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts.length, isLoading])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-neutral-100" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p className="py-8 text-center text-sm text-red-500">{error.message || 'Error al cargar publicaciones'}</p>
    )
  }

  if (posts.length === 0) {
    if (adminBusinessId) {
      return (
        <div className="rounded-[1.75rem] border border-dashed border-primary-200 bg-primary-50/40 p-8 text-center">
          <h3 className="text-lg font-semibold text-neutral-950">
            Aún no has publicado nada
          </h3>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Tu primera publicación aparecerá aquí y en el feed de tus seguidores.
          </p>
          <button
            type="button"
            onClick={() => openCreateModal(undefined, undefined, adminBusinessId)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-800 active:scale-95"
          >
            <span className="text-base leading-none" aria-hidden="true">+</span>
            Publicar ahora
          </button>
        </div>
      )
    }

    return (
      <div className="rounded-[1.75rem] border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
        <h3 className="text-lg font-semibold text-neutral-950">
          Sin publicaciones aún
        </h3>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Cuando el negocio comparta novedades aparecerán aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
