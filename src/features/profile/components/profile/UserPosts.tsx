'use client'

/**
 * UserPosts Component
 *
 * Lista de posts del usuario con scroll infinito
 * Integrado con el sistema de posts y PostCard
 */

import PostCard from '@/app/(app)/feed/post/components/PostCard'
import type { Post } from '@/app/(app)/feed/post/interfaces/post.interfaces'
import { usePostStore } from '@/app/(app)/feed/post/stores/post.store'
import { useAuth } from '@/features/auth/context/auth-context'
import { ArrowPathIcon } from '@/components/icons/heroicons-shim'
import { useEffect, useMemo, useRef } from 'react'

interface UserPostsProps {
  userId: string
  isOwnProfile?: boolean
}

export default function UserPosts({ userId, isOwnProfile = false }: UserPostsProps) {
  const { user: currentUser } = useAuth()
  const posts = usePostStore((state) => state.posts)
  const isLoading = usePostStore((state) => state.isLoading)
  const fetchUserPosts = usePostStore((state) => state.fetchUserPosts)
  const fetchMyPosts = usePostStore((state) => state.fetchMyPosts)
  const hasLoadedPosts = useRef(false)

  useEffect(() => {
    if (userId && !hasLoadedPosts.current) {
      hasLoadedPosts.current = true

      // Si es el perfil del usuario autenticado, usar fetchMyPosts
      if (currentUser?.id === userId) {
        fetchMyPosts({ limit: 20 })
      } else {
        fetchUserPosts(userId, { limit: 20 })
      }
    }
  }, [userId, currentUser?.id, fetchUserPosts, fetchMyPosts])

  // Filtrar posts del usuario específico desde el store y eliminar duplicados
  const userPosts = useMemo(() => {
    if (!posts || !Array.isArray(posts)) return []

    // Filtrar por userId
    const filtered = posts.filter((post: Post) => post.author.id === userId)

    // Eliminar duplicados por ID
    const seen = new Set<string>()
    return filtered.filter((post: Post) => {
      if (seen.has(post.id)) {
        return false
      }
      seen.add(post.id)
      return true
    })
  }, [posts, userId])

  if (isLoading && userPosts.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <ArrowPathIcon className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (userPosts.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
        <p className="text-muted-foreground">
          {isOwnProfile
            ? 'Aún no has publicado nada. ¡Crea tu primera publicación!'
            : 'Este usuario no ha publicado nada aún.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {userPosts.map((post: Post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
