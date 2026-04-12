'use client'

/**
 * useArticles Hook
 *
 * Provides article fetching and pagination functionality
 */

import { useCallback, useEffect, useState } from 'react'
import { ArticleBasic, ArticleFilters, ArticleListResponse } from '../interfaces'
import { articleService } from '../services'

interface UseArticlesOptions {
  initialFilters?: ArticleFilters
  limit?: number
  autoFetch?: boolean
}

interface UseArticlesReturn {
  articles: ArticleBasic[]
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  hasMore: boolean
  totalCount: number
  filters: ArticleFilters
  setFilters: (filters: ArticleFilters) => void
  fetchArticles: () => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
}

export function useArticles(options: UseArticlesOptions = {}): UseArticlesReturn {
  const { initialFilters = {}, limit = 12, autoFetch = true } = options

  const [articles, setArticles] = useState<ArticleBasic[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<ArticleFilters>(initialFilters)

  const fetchArticles = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result: ArticleListResponse = await articleService.getArticles({
        page: 1,
        limit,
        ...filters,
      })

      setArticles(result.articles)
      setTotalCount(result.totalCount)
      setHasMore(result.hasMore)
      setPage(1)
    } catch (err) {
      setError('Error al cargar los artículos')
      console.error('Error fetching articles:', err)
    } finally {
      setIsLoading(false)
    }
  }, [filters, limit])

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    setError(null)

    try {
      const nextPage = page + 1
      const result: ArticleListResponse = await articleService.getArticles({
        page: nextPage,
        limit,
        ...filters,
      })

      setArticles((prev) => [...prev, ...result.articles])
      setHasMore(result.hasMore)
      setPage(nextPage)
    } catch (err) {
      setError('Error al cargar más artículos')
      console.error('Error loading more articles:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [filters, limit, page, hasMore, isLoadingMore])

  const refresh = useCallback(async () => {
    await fetchArticles()
  }, [fetchArticles])

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch) {
      fetchArticles()
    }
  }, [autoFetch, filters])

  return {
    articles,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    filters,
    setFilters,
    fetchArticles,
    loadMore,
    refresh,
  }
}
