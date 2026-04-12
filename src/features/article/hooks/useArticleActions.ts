'use client'

/**
 * useArticleActions Hook
 *
 * Provides article interaction functionality including
 * like, bookmark, share, delete, and view tracking
 */

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Article } from '../interfaces'
import { articleService } from '../services'

interface UseArticleActionsReturn {
  isLiked: boolean
  likeCount: number
  isBookmarked: boolean
  isLoading: boolean
  isDeleting: boolean
  handleLike: () => Promise<void>
  handleBookmark: () => Promise<void>
  handleShare: () => Promise<void>
  handleDelete: () => Promise<void>
  recordView: () => void
}

export function useArticleActions(article: Article, currentUserId?: string | null): UseArticleActionsReturn {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(article._count.likes)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewRecorded, setViewRecorded] = useState(false)

  // Initialize like and bookmark status
  useEffect(() => {
    if (currentUserId) {
      const checkStatus = async () => {
        const [liked, bookmarked] = await Promise.all([
          articleService.isLikedByUser(article.id, currentUserId),
          articleService.isBookmarkedByUser(article.id, currentUserId),
        ])
        setIsLiked(liked)
        setIsBookmarked(bookmarked)
      }
      checkStatus()
    }
  }, [article.id, currentUserId])

  const handleLike = useCallback(async () => {
    if (!currentUserId || isLoading) return

    setIsLoading(true)
    const previousIsLiked = isLiked
    const previousCount = likeCount

    // Optimistic update
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)

    try {
      const result = await articleService.toggleLike(article.id, currentUserId)

      if (!result.success) {
        // Revert on error
        setIsLiked(previousIsLiked)
        setLikeCount(previousCount)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      setIsLiked(previousIsLiked)
      setLikeCount(previousCount)
    } finally {
      setIsLoading(false)
    }
  }, [article.id, currentUserId, isLiked, likeCount, isLoading])

  const handleBookmark = useCallback(async () => {
    if (!currentUserId || isLoading) return

    setIsLoading(true)
    const previousIsBookmarked = isBookmarked

    // Optimistic update
    setIsBookmarked(!isBookmarked)

    try {
      const result = await articleService.toggleBookmark(article.id, currentUserId)

      if (!result.success) {
        // Revert on error
        setIsBookmarked(previousIsBookmarked)
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      setIsBookmarked(previousIsBookmarked)
    } finally {
      setIsLoading(false)
    }
  }, [article.id, currentUserId, isBookmarked, isLoading])

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/feed/article/${article.id}`
    const title = article.title

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        })
      } catch (error) {
        // User cancelled or share failed
        console.log('Share cancelled or failed:', error)
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url)
        // Could show toast here
        console.log('Link copied to clipboard')
      } catch (error) {
        console.error('Failed to copy link:', error)
      }
    }
  }, [article.id, article.title])

  const handleDelete = useCallback(async () => {
    if (!currentUserId || isDeleting) return

    setIsDeleting(true)

    try {
      const result = await articleService.deleteArticle(article.id, currentUserId)

      if (result.success) {
        router.push('/feed')
      } else {
        console.error('Error deleting article:', result.error)
      }
    } catch (error) {
      console.error('Error deleting article:', error)
    } finally {
      setIsDeleting(false)
    }
  }, [article.id, currentUserId, isDeleting, router])

  const recordView = useCallback(() => {
    if (viewRecorded) return

    setViewRecorded(true)
    articleService.recordView(article.id, currentUserId || undefined).catch((error) => {
      console.error('Error recording view:', error)
    })
  }, [article.id, currentUserId, viewRecorded])

  return {
    isLiked,
    likeCount,
    isBookmarked,
    isLoading,
    isDeleting,
    handleLike,
    handleBookmark,
    handleShare,
    handleDelete,
    recordView,
  }
}
