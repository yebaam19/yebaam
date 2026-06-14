'use client'

import { ClubsGrid, CreateClubModal, Pagination } from '@/features/clubs/components'
import { ClubsHero } from '@/features/clubs/components/ClubsHero'
import { useClubesPage } from '@/features/clubs/hooks/useClubesPage'
import { AdjustmentsHorizontalIcon, MagnifyingGlassIcon } from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'

export function ClubesPageContainer() {
  const t = useTranslations('clubes')
  const {
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
    openCreateModal,
  } = useClubesPage()

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-5">
      <ClubsHero onCreateClick={openCreateModal} showCreateButton />

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
                placeholder={t('list.searchPlaceholder')}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-emerald-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:focus:bg-neutral-900"
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-emerald-300 hover:text-emerald-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-emerald-700 dark:hover:text-emerald-300"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              {t('list.filters')}
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
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
            emptyMessage={emptyMessage}
          />
          {activeTab !== 'mis-clubes' && <Pagination totalPages={totalPages} />}
        </>
      )}

      <CreateClubModal />
    </div>
  )
}
