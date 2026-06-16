'use client'

import { useEffect, useState } from 'react'
import { PostCard } from '@/features/post'
import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces'
import { usePostStore } from '@/app/(app)/feed/post/stores/post.store'

interface Props {
  businessId: string
  onCountLoaded?: (n: number) => void
  /** When set, renders an admin empty state with a publish CTA */
  adminBusinessId?: string
}

export function BusinessSocialFeed({ businessId, onCountLoaded, adminBusinessId }: Props) {
  const openCreateModal = usePostStore((s) => s.openCreateModal)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/posts?scope=business&businessId=${businessId}&limit=20`)
        const json = await res.json() as { success?: boolean; data?: Post[]; error?: string }
        if (!cancelled) {
          if (json.success && Array.isArray(json.data)) {
            setPosts(json.data)
            onCountLoaded?.(json.data.length)
          } else {
            setError(json.error ?? 'Error al cargar publicaciones')
          }
        }
      } catch {
        if (!cancelled) setError('Error al cargar publicaciones')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [businessId])

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
      <p className="py-8 text-center text-sm text-red-500">{error}</p>
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
