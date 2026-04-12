'use client'

/**
 * ArticleContextSelector Component
 *
 * Dropdown selector for choosing where to publish an article
 * (user profile, blog, club, professional context)
 * Matching legacy UI with selection indicators and grouping
 */

import { Button } from '@/ui/Button'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { BookOpenIcon, BriefcaseIcon, ChevronDownIcon, UserGroupIcon, UserIcon } from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'
import { useEffect, useState } from 'react'
import { ArticleContext, ArticleContextType } from '../interfaces'
import { articleService } from '../services'

interface ArticleContextSelectorProps {
  selectedContext: {
    type: ArticleContextType
    id: string | null
    name: string
  }
  onSelect: (context: { type: ArticleContextType; id: string | null; name: string }) => void
  authorId: string
  isLoading?: boolean
  variant?: 'default' | 'compact'
}

const contextIcons: Record<ArticleContextType, React.ReactNode> = {
  [ArticleContextType.USER_PROFILE]: <UserIcon className="h-3 w-3 sm:h-4 sm:w-4" />,
  [ArticleContextType.BLOG]: <BookOpenIcon className="h-3 w-3 sm:h-4 sm:w-4" />,
  [ArticleContextType.CLUB]: <UserGroupIcon className="h-3 w-3 sm:h-4 sm:w-4" />,
  [ArticleContextType.PROFESSIONAL]: <BriefcaseIcon className="h-3 w-3 sm:h-4 sm:w-4" />,
}

export function ArticleContextSelector({
  selectedContext,
  onSelect,
  authorId,
  isLoading: externalLoading,
  variant = 'default',
}: ArticleContextSelectorProps) {
  const [contexts, setContexts] = useState<ArticleContext[]>([])
  const [isLoadingContexts, setIsLoadingContexts] = useState(true)

  const isLoading = externalLoading ?? isLoadingContexts

  useEffect(() => {
    const loadContexts = async () => {
      setIsLoadingContexts(true)
      try {
        const availableContexts = await articleService.getAvailableContexts(authorId)
        setContexts(availableContexts)
      } catch (error) {
        console.error('Error loading contexts:', error)
      } finally {
        setIsLoadingContexts(false)
      }
    }

    loadContexts()
  }, [authorId])

  // Separate contexts by type
  const userProfileContext = contexts.find((ctx) => ctx.type === ArticleContextType.USER_PROFILE)
  const professionalContext = contexts.find((ctx) => ctx.type === ArticleContextType.PROFESSIONAL)
  const blogContexts = contexts.filter((ctx) => ctx.type === ArticleContextType.BLOG)
  const clubContexts = contexts.filter((ctx) => ctx.type === ArticleContextType.CLUB)

  const handleSelect = (context: ArticleContext) => {
    onSelect({
      type: context.type,
      id: context.id,
      name: context.name,
    })
  }

  const handleSelectUserProfile = () => {
    onSelect({
      type: ArticleContextType.USER_PROFILE,
      id: null,
      name: 'Artículo individual',
    })
  }

  const isSelected = (type: ArticleContextType, id: string | null) => {
    return selectedContext.type === type && selectedContext.id === id
  }

  // Compact variant for header
  if (variant === 'compact') {
    return (
      <Menu as="div" className="relative">
        <MenuButton className="flex min-w-[140px] items-center gap-1 rounded-md bg-transparent px-1 text-xs outline-none hover:bg-neutral-100 focus:ring-0 dark:hover:bg-neutral-800">
          {isLoading ? (
            <div className="flex items-center gap-1">
              <ArrowPathIcon className="h-3 w-3 animate-spin" />
              <span>Cargando...</span>
            </div>
          ) : (
            <>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Publicar en:</span>
              <div className="flex items-center gap-1">
                {contextIcons[selectedContext.type]}
                <span className="truncate">{selectedContext.name}</span>
                <ChevronDownIcon className="h-3 w-3 opacity-50" />
              </div>
            </>
          )}
        </MenuButton>

        <MenuItems className="absolute left-0 z-50 mt-2 w-52 origin-top-left rounded-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none sm:w-72 dark:bg-neutral-800 dark:ring-white/10">
          <ContextMenuContent
            userProfileContext={userProfileContext}
            professionalContext={professionalContext}
            blogContexts={blogContexts}
            clubContexts={clubContexts}
            isLoading={isLoading}
            isSelected={isSelected}
            handleSelectUserProfile={handleSelectUserProfile}
            handleSelect={handleSelect}
          />
        </MenuItems>
      </Menu>
    )
  }

  // Default variant (button)
  return (
    <Menu as="div" className="relative">
      <MenuButton as={Button} outline className="gap-2 text-sm">
        {contextIcons[selectedContext.type]}
        <span className="max-w-[150px] truncate">{selectedContext.name}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </MenuButton>

      <MenuItems className="absolute right-0 z-50 mt-2 w-52 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none sm:w-72 dark:bg-neutral-800 dark:ring-white/10">
        <ContextMenuContent
          userProfileContext={userProfileContext}
          professionalContext={professionalContext}
          blogContexts={blogContexts}
          clubContexts={clubContexts}
          isLoading={isLoading}
          isSelected={isSelected}
          handleSelectUserProfile={handleSelectUserProfile}
          handleSelect={handleSelect}
        />
      </MenuItems>
    </Menu>
  )
}

// Extracted menu content component
interface ContextMenuContentProps {
  userProfileContext: ArticleContext | undefined
  professionalContext: ArticleContext | undefined
  blogContexts: ArticleContext[]
  clubContexts: ArticleContext[]
  isLoading: boolean
  isSelected: (type: ArticleContextType, id: string | null) => boolean
  handleSelectUserProfile: () => void
  handleSelect: (context: ArticleContext) => void
}

function ContextMenuContent({
  userProfileContext,
  professionalContext,
  blogContexts,
  clubContexts,
  isLoading,
  isSelected,
  handleSelectUserProfile,
  handleSelect,
}: ContextMenuContentProps) {
  return (
    <div className="max-h-[60vh] overflow-y-auto p-1">
      {/* Publicar como section */}
      <div className="px-2 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">Publicar como</div>

      {/* User Profile */}
      <MenuItem>
        {({ focus }) => (
          <button
            onClick={handleSelectUserProfile}
            className={`${
              focus ? 'bg-neutral-100 dark:bg-neutral-700' : ''
            } flex w-full items-center gap-2 rounded-md px-2 py-2 sm:gap-3 sm:px-3`}
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 sm:h-8 sm:w-8 dark:bg-neutral-700">
              <UserIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
            <span className="flex-1 truncate text-sm text-neutral-900 dark:text-white">Artículo individual</span>
            {isSelected(ArticleContextType.USER_PROFILE, null) && (
              <div className="h-2 w-2 shrink-0 rounded-full bg-green-600" />
            )}
          </button>
        )}
      </MenuItem>

      {/* Publicar en section */}
      <div className="mt-2 px-2 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">Publicar en</div>

      {/* Professional Profile */}
      {professionalContext && (
        <MenuItem>
          {({ focus }) => (
            <button
              onClick={() => handleSelect(professionalContext)}
              disabled={professionalContext.disabled}
              className={`${
                focus ? 'bg-neutral-100 dark:bg-neutral-700' : ''
              } flex w-full items-center gap-2 rounded-md px-2 py-2 sm:gap-3 sm:px-3 ${
                professionalContext.disabled ? 'cursor-not-allowed opacity-50' : ''
              }`}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-neutral-100 sm:h-8 sm:w-8 dark:bg-neutral-700">
                <BriefcaseIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-neutral-900 dark:text-white">
                  Perfil profesional
                </span>
                {professionalContext.disabled && professionalContext.disabledReason && (
                  <span className="block truncate text-xs text-neutral-500">{professionalContext.disabledReason}</span>
                )}
              </div>
              {isSelected(ArticleContextType.PROFESSIONAL, professionalContext.id) && (
                <div className="h-2 w-2 shrink-0 rounded-full bg-green-600" />
              )}
            </button>
          )}
        </MenuItem>
      )}

      {/* Blogs */}
      {blogContexts.length > 0 && (
        <>
          <div className="mt-2 px-2 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Mis Blogs ({blogContexts.length})
          </div>
          {blogContexts.map((blog) => (
            <MenuItem key={`blog-${blog.id}`}>
              {({ focus }) => (
                <button
                  onClick={() => handleSelect(blog)}
                  className={`${
                    focus ? 'bg-neutral-100 dark:bg-neutral-700' : ''
                  } flex w-full items-center gap-2 rounded-md px-2 py-2 sm:gap-3 sm:px-3`}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-neutral-100 sm:h-8 sm:w-8 dark:bg-neutral-700">
                    {blog.imageUrl ? (
                      <img src={blog.imageUrl} alt={blog.name} className="h-full w-full rounded object-cover" />
                    ) : (
                      <BookOpenIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-neutral-900 dark:text-white">
                      {blog.name}
                    </span>
                    {blog.description && (
                      <span className="block truncate text-xs text-neutral-500">{blog.description}</span>
                    )}
                  </div>
                  {isSelected(ArticleContextType.BLOG, blog.id) && (
                    <div className="h-2 w-2 shrink-0 rounded-full bg-green-600" />
                  )}
                </button>
              )}
            </MenuItem>
          ))}
        </>
      )}

      {/* Clubs */}
      {clubContexts.length > 0 && (
        <>
          <div className="mt-2 px-2 py-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Mis Clubs ({clubContexts.length})
          </div>
          {clubContexts.map((club) => (
            <MenuItem key={`club-${club.id}`}>
              {({ focus }) => (
                <button
                  onClick={() => handleSelect(club)}
                  className={`${
                    focus ? 'bg-neutral-100 dark:bg-neutral-700' : ''
                  } flex w-full items-center gap-2 rounded-md px-2 py-2 sm:gap-3 sm:px-3`}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-neutral-100 sm:h-8 sm:w-8 dark:bg-neutral-700">
                    {club.imageUrl ? (
                      <img src={club.imageUrl} alt={club.name} className="h-full w-full rounded object-cover" />
                    ) : (
                      <UserGroupIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-neutral-900 dark:text-white">
                      {club.name}
                    </span>
                    {club.description && (
                      <span className="block truncate text-xs text-neutral-500">{club.description}</span>
                    )}
                  </div>
                  {isSelected(ArticleContextType.CLUB, club.id) && (
                    <div className="h-2 w-2 shrink-0 rounded-full bg-green-600" />
                  )}
                </button>
              )}
            </MenuItem>
          ))}
        </>
      )}

      {isLoading && (
        <div className="flex items-center justify-center gap-2 p-3 text-sm text-neutral-500">
          <ArrowPathIcon className="h-4 w-4 animate-spin" />
          Cargando...
        </div>
      )}
    </div>
  )
}
