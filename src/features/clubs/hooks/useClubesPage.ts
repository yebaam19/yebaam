'use client'

import {
  useJoinClub,
  useLeaveClub,
  useMyClubs,
  usePopularClubsPage,
  useSuggestedClubsPage,
} from './useClubs'
import { useClubsUIStore } from '../store/clubsUIStore'
import { clubsService } from '../services/clubs.service'
import type { Club } from '../types/club.types'
import { FireIcon, SparklesIcon, StarIcon, UsersIcon } from '@/components/icons/heroicons-shim'
import type { Route } from 'next'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

type TabType = 'mis-clubes' | 'sugeridos' | 'populares' | 'nuevos'

const PAGE_SIZE = 12
const SEARCH_DEBOUNCE_MS = 300

/**
 * View-model for `ClubesPageContainer`: owns the tab/page URL state, the four
 * data queries, join/leave mutations, the client-side search filter, and the
 * per-tab derived flags (loading, total pages, empty message). The container
 * only renders what this returns.
 */
export function useClubesPage() {
  const t = useTranslations('clubes')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const tabParam = (searchParams.get('tab') as TabType) || 'mis-clubes'
  const pageParam = Math.max(1, Number(searchParams.get('page')) || 1)

  const [activeTab, setActiveTab] = useState<TabType>(tabParam)
  const [loadingClubId, setLoadingClubId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  // Server-side search results (across all pages). null = not searching.
  const [searchResults, setSearchResults] = useState<Club[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    setActiveTab(tabParam)
  }, [tabParam])

  // Debounced server-side search. The activeData filter only sees the loaded
  // page, so an empty query falls back to tab data and a non-empty query hits
  // /api/clubs/search to match clubs across every page.
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) {
      setSearchResults(null)
      setIsSearching(false)
      return
    }

    let cancelled = false
    setIsSearching(true)
    const handle = setTimeout(async () => {
      try {
        const res = await clubsService.searchClubs({ query: q })
        if (!cancelled) setSearchResults(res.clubs)
      } catch {
        if (!cancelled) setSearchResults([])
      } finally {
        if (!cancelled) setIsSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [searchQuery])

  const { setIsCreateModalOpen } = useClubsUIStore()

  const { data: myClubs, isLoading: isLoadingMyClubs } = useMyClubs()
  const { data: suggestedPage, isLoading: isLoadingSuggested } = useSuggestedClubsPage(
    activeTab === 'sugeridos' ? pageParam : 1,
    PAGE_SIZE,
  )
  const { data: popularPage, isLoading: isLoadingPopular } = usePopularClubsPage(
    activeTab === 'populares' || activeTab === 'nuevos' ? pageParam : 1,
    PAGE_SIZE,
  )

  const joinMutation = useJoinClub()
  const leaveMutation = useLeaveClub()

  const handleJoin = async (clubId: string) => {
    setLoadingClubId(clubId)
    try {
      await joinMutation.mutateAsync(clubId)
    } finally {
      setLoadingClubId(null)
    }
  }

  const handleLeave = async (clubId: string) => {
    setLoadingClubId(clubId)
    try {
      await leaveMutation.mutateAsync(clubId)
    } finally {
      setLoadingClubId(null)
    }
  }

  const changeTab = (tab: TabType) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'mis-clubes') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    params.delete('page')
    const qs = params.toString()
    router.replace((qs ? `${pathname}?${qs}` : pathname) as Route, { scroll: false })
  }

  const tabs = [
    {
      id: 'mis-clubes' as TabType,
      label: t('list.tabs.mine'),
      icon: UsersIcon,
      count: Array.isArray(myClubs) ? myClubs.length : undefined,
    },
    {
      id: 'sugeridos' as TabType,
      label: t('list.tabs.suggested'),
      icon: SparklesIcon,
      count: suggestedPage?.totalCount,
    },
    {
      id: 'populares' as TabType,
      label: t('list.tabs.popular'),
      icon: FireIcon,
      count: undefined,
    },
    {
      id: 'nuevos' as TabType,
      label: t('list.tabs.new'),
      icon: StarIcon,
      count: undefined,
    },
  ]

  const isSearchMode = searchQuery.trim().length > 0

  const activeData = useMemo(() => {
    // When the user is searching, surface the server-side results (across all
    // pages) instead of filtering the currently-loaded tab page.
    if (isSearchMode) return searchResults ?? []

    if (activeTab === 'mis-clubes') return Array.isArray(myClubs) ? myClubs : []
    if (activeTab === 'sugeridos') return suggestedPage?.items ?? []
    return popularPage?.items ?? []
  }, [isSearchMode, searchResults, activeTab, myClubs, suggestedPage, popularPage])

  // Search results are a single flat list, so collapse pagination to one page.
  const totalPages = isSearchMode
    ? 1
    : activeTab === 'sugeridos'
      ? suggestedPage?.totalPages ?? 1
      : activeTab === 'populares' || activeTab === 'nuevos'
        ? popularPage?.totalPages ?? 1
        : 1

  const isLoading = isSearchMode
    ? isSearching
    : activeTab === 'mis-clubes'
      ? isLoadingMyClubs
      : activeTab === 'sugeridos'
        ? isLoadingSuggested
        : isLoadingPopular

  const emptyMessage = isSearchMode
    ? t('list.empty.default')
    : activeTab === 'mis-clubes'
      ? t('list.empty.mine')
      : activeTab === 'sugeridos'
        ? t('list.empty.suggested')
        : activeTab === 'nuevos'
          ? t('list.empty.new')
          : t('list.empty.popular')

  return {
    activeTab,
    tabs,
    activeData,
    isLoading,
    totalPages,
    emptyMessage,
    loadingClubId,
    searchQuery,
    setSearchQuery,
    handleJoin,
    handleLeave,
    changeTab,
    openCreateModal: () => setIsCreateModalOpen(true),
  }
}
