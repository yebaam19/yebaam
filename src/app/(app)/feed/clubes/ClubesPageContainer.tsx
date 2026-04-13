'use client'

import { ClubsGrid, CreateClubModal } from '@/features/clubs/components'
import { ClubsHero } from '@/features/clubs/components/ClubsHero'
import {
  useJoinClub,
  useLeaveClub,
  useMyClubs,
  usePopularClubs,
  useSuggestedClubs,
} from '@/features/clubs/hooks/useClubs'
import { useClubsUIStore } from '@/features/clubs/store/clubsUIStore'
import { FireIcon, SparklesIcon, UsersIcon } from '@/components/icons/heroicons-shim'
import { useState } from 'react'

type TabType = 'mis-clubes' | 'sugeridos' | 'descubrir'

export function ClubesPageContainer() {
  const [activeTab, setActiveTab] = useState<TabType>('mis-clubes')
  const [loadingClubId, setLoadingClubId] = useState<string | null>(null)

  // UI Store
  const { setIsCreateModalOpen } = useClubsUIStore()

  // Queries
  const { data: myClubs, isLoading: isLoadingMyClubs } = useMyClubs()
  const { data: suggestedClubs, isLoading: isLoadingSuggested } = useSuggestedClubs(12)
  const { data: popularClubs, isLoading: isLoadingPopular } = usePopularClubs(12)

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
      count: Array.isArray(suggestedClubs) ? suggestedClubs.length : undefined,
    },
    {
      id: 'descubrir' as TabType,
      label: 'Descubrir',
      icon: FireIcon,
      count: Array.isArray(popularClubs) ? popularClubs.length : undefined,
    },
  ]

  const getActiveData = () => {
    const data =
      activeTab === 'mis-clubes' ? myClubs : activeTab === 'sugeridos' ? suggestedClubs : popularClubs
    return Array.isArray(data) ? data : []
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
      <ClubsHero onCreateClick={() => setIsCreateModalOpen(true)} showCreateButton={activeTab === 'mis-clubes'} />

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="h-32 bg-neutral-200 dark:bg-neutral-700" />
              <div className="space-y-3 p-4">
                <div className="h-6 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-4 rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-4 w-5/6 rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-10 rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ClubsGrid
          clubs={getActiveData()}
          onJoin={handleJoin}
          onLeave={handleLeave}
          loadingClubId={loadingClubId}
          emptyMessage={getEmptyMessage()}
        />
      )}

      {/* Modal de creación */}
      <CreateClubModal />
    </div>
  )
}
