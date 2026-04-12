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
import { BookOpenIcon, FireIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

type TabType = 'siguiendo' | 'mis-blogs' | 'descubrir'

export function BlogsPageContainer() {
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
      label: 'Siguiendo',
      icon: BookOpenIcon,
      count: myBlogs?.length,
    },
    {
      id: 'mis-blogs' as TabType,
      label: 'Sugeridos',
      icon: SparklesIcon,
      count: suggestedBlogs?.length,
    },
    {
      id: 'descubrir' as TabType,
      label: 'Descubrir',
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
        return 'No sigues ningún blog todavía'
      case 'mis-blogs':
        return 'No hay blogs sugeridos en este momento'
      case 'descubrir':
      default:
        return 'No se encontraron blogs populares'
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-5">
      {/* Hero */}
      <BlogsHero onCreateClick={() => setIsCreateModalOpen(true)} showCreateButton={activeTab === 'mis-blogs'} />

      {/* Create Blog Modal */}
      <CreateBlogModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      {/* Tabs */}
      <div className="mt-8 mb-8 border-b border-neutral-200 dark:border-neutral-700">
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
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300'
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
              <div className="h-40 bg-neutral-200 dark:bg-neutral-700" />
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
                    <div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
                  </div>
                </div>
                <div className="h-6 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-4 rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-4 w-5/6 rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-10 rounded bg-neutral-200 dark:bg-neutral-700" />
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
    </div>
  )
}
