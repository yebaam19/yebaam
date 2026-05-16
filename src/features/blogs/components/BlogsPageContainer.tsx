'use client'

import { BlogsGrid } from '@/features/blogs/components'
import { BlogsHero } from '@/features/blogs/components/BlogsHero'
import { CreateBlogModal } from '@/features/blogs/components/CreateBlogModal'
import {
  useFollowBlog,
  useMyBlogs,
  usePopularBlogs,
  useSuggestedBlogs,
  useUnfollowBlog,
} from '@/features/blogs/hooks/useBlogs'
import { BookOpenIcon, FireIcon, SparklesIcon } from '@/components/icons/heroicons-shim'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

type TabType = 'siguiendo' | 'mis-blogs' | 'descubrir'

export function BlogsPageContainer() {
  const t = useTranslations('blogs.list')
  const [activeTab, setActiveTab] = useState<TabType>('siguiendo')
  const [loadingBlogId, setLoadingBlogId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Queries
  const { data: myBlogs, isLoading: isLoadingMyBlogs } = useMyBlogs()
  const { data: suggestedBlogs, isLoading: isLoadingSuggested } = useSuggestedBlogs(12)
  const { data: popularBlogs, isLoading: isLoadingPopular } = usePopularBlogs(12)

  console.log(
    'BlogsPage render: activeTab=',
    activeTab,
    'myBlogs=',
    myBlogs,
    'suggestedBlogs=',
    suggestedBlogs,
    'popularBlogs=',
    popularBlogs
  )

  // Mutations
  const followMutation = useFollowBlog()
  const unfollowMutation = useUnfollowBlog()

  const handleFollow = async (blogId: string) => {
    setLoadingBlogId(blogId)
    try {
      await followMutation.mutateAsync(blogId)
    } finally {
      setLoadingBlogId(null)
    }
  }

  const handleUnfollow = async (blogId: string) => {
    setLoadingBlogId(blogId)
    try {
      await unfollowMutation.mutateAsync(blogId)
    } finally {
      setLoadingBlogId(null)
    }
  }

  const tabs = [
    {
      id: 'siguiendo' as TabType,
      label: t('tabs.following'),
      icon: BookOpenIcon,
      count: myBlogs?.length,
    },
    {
      id: 'mis-blogs' as TabType,
      label: t('tabs.suggested'),
      icon: SparklesIcon,
      count: suggestedBlogs?.length,
    },
    {
      id: 'descubrir' as TabType,
      label: t('tabs.discover'),
      icon: FireIcon,
      count: popularBlogs?.length,
    },
  ]

  const getActiveData = () => {
    switch (activeTab) {
      case 'siguiendo':
        return myBlogs || []
      case 'mis-blogs':
        return suggestedBlogs || []
      case 'descubrir':
      default:
        return popularBlogs || []
    }
  }

  const isLoading = () => {
    switch (activeTab) {
      case 'siguiendo':
        return isLoadingMyBlogs
      case 'mis-blogs':
        return isLoadingSuggested
      case 'descubrir':
      default:
        return isLoadingPopular
    }
  }

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'siguiendo':
        return t('empty.following')
      case 'mis-blogs':
        return t('empty.suggested')
      case 'descubrir':
      default:
        return t('empty.discover')
    }
  }

  return (
    <div className="bg-linear-to-b from-secondary-50/40 via-white to-neutral-50 dark:from-secondary-900/10 dark:via-neutral-950 dark:to-neutral-950">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-8 lg:px-8">
        {/* Hero */}
        <BlogsHero onCreateClick={() => setIsCreateModalOpen(true)} showCreateButton={activeTab === 'mis-blogs'} />

        {/* Create Blog Modal */}
        <CreateBlogModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

        <section className="space-y-5">
          <header className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-700 dark:text-secondary-400">
              {t('section.eyebrow')}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-white">
              {t('section.title')}
            </h2>
            <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
              {t('section.subtitle')}
            </p>
          </header>

          {/* Tabs */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-1.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <nav className="flex flex-wrap gap-1" aria-label={t('section.tabsAria')}>
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex flex-1 min-w-[7.5rem] items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-secondary-600 text-white shadow-sm'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}
                      >
                        {tab.count ?? 0}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          {isLoading() ? (
            <div className="grid w-full gap-4 sm:gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="h-36 bg-neutral-200 dark:bg-neutral-800" />
                  <div className="space-y-3 p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800" />
                        <div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800" />
                      </div>
                    </div>
                    <div className="h-5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-3.5 rounded bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-3.5 w-5/6 rounded bg-neutral-200 dark:bg-neutral-800" />
                    <div className="h-9 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <BlogsGrid
              blogs={getActiveData()}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
              loadingBlogId={loadingBlogId}
              emptyMessage={getEmptyMessage()}
            />
          )}
        </section>
      </div>
    </div>
  )
}
