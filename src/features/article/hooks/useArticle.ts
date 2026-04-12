'use client'

/**
 * useArticle Hook
 *
 * Provides single article fetching functionality
 */

import { useCallback, useEffect, useState } from 'react'
import { Article } from '../interfaces'
import { articleService } from '../services'

interface UseArticleOptions {
  autoFetch?: boolean
}

interface UseArticleReturn {
  article: Article | null
  isLoading: boolean
  error: string | null
  fetchArticle: () => Promise<void>
  refresh: () => Promise<void>
}

export function useArticle(articleId: string, options: UseArticleOptions = {}): UseArticleReturn {
  const { autoFetch = true } = options

  const [article, setArticle] = useState<Article | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchArticle = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await articleService.getArticleById(articleId)

      if (result.success && result.article) {
        setArticle(result.article)
      } else {
        setError(result.error || 'Artículo no encontrado')
      }
    } catch (err) {
      setError('Error al cargar el artículo')
      console.error('Error fetching article:', err)
    } finally {
      setIsLoading(false)
    }
  }, [articleId])

  const refresh = useCallback(async () => {
    await fetchArticle()
  }, [fetchArticle])

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && articleId) {
      fetchArticle()
    }
  }, [autoFetch, articleId])

  return {
    article,
    isLoading,
    error,
    fetchArticle,
    refresh,
  }
}
