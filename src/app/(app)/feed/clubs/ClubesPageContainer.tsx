'use client'

import { ClubsGrid, CreateClubModal, Pagination } from '@/features/clubs/components'
import { ClubsHero } from '@/features/clubs/components/ClubsHero'
import {
  useJoinClub,
  useLeaveClub,
  useMyClubs,
  usePopularClubsPage,
  useSuggestedClubsPage,
} from '@/features/clubs/hooks/useClubs'
import { useClubsUIStore } from '@/features/clubs/store/clubsUIStore'
import { FireIcon, SparklesIcon, UsersIcon } from '@/components/icons/heroicons-shim'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

type TabType = 'mis-clubes' | 'sugeridos' | 'descubrir'

const PAGE_SIZE = 12

export function ClubesPageContainer() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const tabParam = (searchParams.get('tab') as TabType) || 'mis-clubes'
  const pageParam = Math.max(1, Number(searchParams.get('page')) || 1)

  const [activeTab, setActiveTab] = useState<TabType>(tabParam)
  const [loadingClubId, setLoadingClubId] = useState<string | null>(null)

  useEffect(() => {
    setActiveTab(tabParam)
  }, [tabParam])

  // UI Store
  const { setIsCreateModalOpen } = useClubsUIStore()

  // Queries
  const { data: myClubs, isLoading: isLoadingMyClubs } = useMyClubs()
  const { data: suggestedPage, isLoading: isLoadingSuggested } = useSuggestedClubsPage(
    activeTab === 'sugeridos' ? pageParam : 1,
    PAGE_SIZE,
  )
  const { data: popularPage, isLoading: isLoadingPopular } = usePopularClubsPage(
    activeTab === 'descubrir' ? pageParam : 1,
    PAGE_SIZE,
  )

  // Mutations
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
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const tabs = [
    {
      id: 'mis-clubes' as TabType,
      label: 'Mis Clubes',
      icon: UsersIcon,
      count: Array.isArray(myClubs) ? myClubs.length : undefined,
    },
    {
      id: 'sugeridos' as TabType,
      label: 'Sugeridos',
      icon: SparklesIcon,
      count: suggestedPage?.totalCount,
    },
    {
      id: 'descubrir' as TabType,
      label: 'Descubrir',
      icon: FireIcon,
      count: popularPage?.totalCount,
    },
  ]

  const getActiveData = () => {
    if (activeTab === 'mis-clubes') return Array.isArray(myClubs) ? myClubs : []
    if (activeTab === 'sugeridos') return suggestedPage?.items ?? []
    return popularPage?.items ?? []
  }

  const getTotalPages = () => {
    if (activeTab === 'sugeridos') return suggestedPage?.totalPages ?? 1
    if (activeTab === 'descubrir') return popularPage?.totalPages ?? 1
    return 1
  }

  const isLoading = () => {
    switch (activeTab) {
      case 'mis-clubes':
        return isLoadingMyClubs
      case 'sugeridos':
        return isLoadingSuggested
      case 'descubrir':
      default:
        return isLoadingPopular
    }
  }

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'mis-clubes':
        return 'No eres miembro de ningún club todavía'
      case 'sugeridos':
        return 'No hay clubes sugeridos en este momento'
      case 'descubrir':
      default:
        return 'No se encontraron clubes populares'
    }
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-5">
      {/* Hero Section */}
      <ClubsHero
        onCreateClick={() => setIsCreateModalOpen(true)}
        showCreateButton={activeTab === 'mis-clubes'}
      />

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                className={`group inline-flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                } `}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      isActive
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                    } `}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      {isLoading() ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="relative h-24 bg-neutral-200 dark:bg-neutral-800">
                <div className="absolute -bottom-7 left-4 h-14 w-14 rounded-xl border-2 border-white bg-neutral-300 dark:border-neutral-900 dark:bg-neutral-700" />
              </div>
              <div className="space-y-3 px-4 pb-4 pt-10">
                <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-3 w-20 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-3 w-5/6 rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-9 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <ClubsGrid
            clubs={getActiveData()}
            onJoin={handleJoin}
            onLeave={handleLeave}
            loadingClubId={loadingClubId}
            emptyMessage={getEmptyMessage()}
          />
          {activeTab !== 'mis-clubes' && <Pagination totalPages={getTotalPages()} />}
        </>
      )}

      {/* Modal de creación */}
      <CreateClubModal />
    </div>
  )
}
