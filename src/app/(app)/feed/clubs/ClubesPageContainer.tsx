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
import {
  AdjustmentsHorizontalIcon,
  FireIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  StarIcon,
  UsersIcon,
} from '@/components/icons/heroicons-shim'
import type { Route } from 'next'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type TabType = 'mis-clubes' | 'sugeridos' | 'populares' | 'nuevos'

const PAGE_SIZE = 12

export function ClubesPageContainer() {
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
      label: 'Mis clubes',
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
      id: 'populares' as TabType,
      label: 'Populares',
      icon: FireIcon,
      count: undefined,
    },
    {
      id: 'nuevos' as TabType,
      label: 'Nuevos',
      icon: StarIcon,
      count: undefined,
    },
  ]

  const activeData = useMemo(() => {
    let items: ReturnType<typeof getActiveItems>
    function getActiveItems() {
      if (activeTab === 'mis-clubes') return Array.isArray(myClubs) ? myClubs : []
      if (activeTab === 'sugeridos') return suggestedPage?.items ?? []
      return popularPage?.items ?? []
    }
    items = getActiveItems()

    const q = searchQuery.trim().toLowerCase()
    if (!q) return items
    return items.filter((club) => {
      const haystack = `${club.name} ${club.description ?? ''} ${club.category ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [activeTab, myClubs, suggestedPage, popularPage, searchQuery])

  const getTotalPages = () => {
    if (activeTab === 'sugeridos') return suggestedPage?.totalPages ?? 1
    if (activeTab === 'populares' || activeTab === 'nuevos') return popularPage?.totalPages ?? 1
    return 1
  }

  const isLoading = () => {
    switch (activeTab) {
      case 'mis-clubes':
        return isLoadingMyClubs
      case 'sugeridos':
        return isLoadingSuggested
      case 'populares':
      case 'nuevos':
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
      case 'nuevos':
        return 'No se encontraron clubes recientes'
      case 'populares':
      default:
        return 'No se encontraron clubes populares'
    }
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-5">
      <ClubsHero
        onCreateClick={() => setIsCreateModalOpen(true)}
        showCreateButton
      />

      <div className="rounded-2xl border border-neutral-200/80 bg-white px-3 py-2 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:px-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <nav className="-mb-px flex min-w-0 items-center gap-x-5 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => changeTab(tab.id)}
                  className={`group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <div className="relative w-full md:w-56 lg:w-64">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar clubes..."
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:focus:bg-neutral-900"
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-emerald-300 hover:text-emerald-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              Filtros
            </button>
          </div>
        </div>
      </div>

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
            clubs={activeData}
            onJoin={handleJoin}
            onLeave={handleLeave}
            loadingClubId={loadingClubId}
            emptyMessage={getEmptyMessage()}
          />
          {activeTab !== 'mis-clubes' && <Pagination totalPages={getTotalPages()} />}
        </>
      )}

      <CreateClubModal />
    </div>
  )
}
