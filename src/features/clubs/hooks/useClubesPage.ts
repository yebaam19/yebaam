'use client'

import {
  useJoinClub,
  useLeaveClub,
  useMyClubs,
  usePopularClubsPage,
  useSuggestedClubsPage,
} from './useClubs'
import { useClubsUIStore } from '../store/clubsUIStore'
import { FireIcon, SparklesIcon, StarIcon, UsersIcon } from '@/components/icons/heroicons-shim'
import type { Route } from 'next'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

type TabType = 'mis-clubes' | 'sugeridos' | 'populares' | 'nuevos'

const PAGE_SIZE = 12

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

  useEffect(() => {
    setActiveTab(tabParam)
  }, [tabParam])

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

  const activeData = useMemo(() => {
    function getActiveItems() {
      if (activeTab === 'mis-clubes') return Array.isArray(myClubs) ? myClubs : []
      if (activeTab === 'sugeridos') return suggestedPage?.items ?? []
      return popularPage?.items ?? []
    }
    const items = getActiveItems()

    const q = searchQuery.trim().toLowerCase()
    if (!q) return items
    return items.filter((club) => {
      const haystack = `${club.name} ${club.description ?? ''} ${club.category ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [activeTab, myClubs, suggestedPage, popularPage, searchQuery])

  const totalPages =
    activeTab === 'sugeridos'
      ? suggestedPage?.totalPages ?? 1
      : activeTab === 'populares' || activeTab === 'nuevos'
        ? popularPage?.totalPages ?? 1
        : 1

  const isLoading =
    activeTab === 'mis-clubes'
      ? isLoadingMyClubs
      : activeTab === 'sugeridos'
        ? isLoadingSuggested
        : isLoadingPopular

  const emptyMessage =
    activeTab === 'mis-clubes'
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
