'use client'

import { Bars3Icon, ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import Link from 'next/link'
import React from 'react'
import { useTranslations } from 'next-intl'

import type { ResolvedMenuItem } from '@/config/menuConfig'
import { AuthUser } from '@/features/auth/interfaces/auth.interfaces'
import { getUserInitials, getUserDisplayName } from '@/lib/user-helpers'
import { cn } from '@/lib/utils'
import { getUserAvatarUrl } from '@/lib/utils/avatar'
import Avatar from '@/ui/Avatar'

const FEED_PATH = '/feed'

const isExternalHref = (href: string) => /^https?:\/\//i.test(href)

interface SmartLinkProps {
  href: string
  className?: string
  title?: string
  children: React.ReactNode
}

function SmartLink({ href, className, title, children }: SmartLinkProps) {
  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        title={title}
      >
        {children}
      </a>
    )
  }
  // Nav targets are dynamic (`private, no-store`) routes; prefetching all of
  // them on every shell mount costs ~2 server renders each. Only /feed keeps
  // the default prefetch.
  return (
    <Link
      href={href as never}
      className={className}
      title={title}
      prefetch={href === FEED_PATH ? undefined : false}
    >
      {children}
    </Link>
  )
}

export interface SidebarContentProps {
  isMobile?: boolean
  user: AuthUser
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  onMobileClose?: () => void
  visibleItems: ResolvedMenuItem[]
  additionalItems: ResolvedMenuItem[]
  isExpanded: boolean
  toggleExpanded: () => void
  isPathActive: (href: string) => boolean
}

// Contenido del sidebar (compartido entre mobile y desktop)
export function SidebarContent({
  isMobile = false,
  user,
  isCollapsed,
  setIsCollapsed,
  onMobileClose,
  visibleItems,
  additionalItems,
  isExpanded,
  toggleExpanded,
  isPathActive,
}: SidebarContentProps) {
  const t = useTranslations('nav')
  const fullName = getUserDisplayName(user)
  const initials = getUserInitials(fullName)
  const hasMoreItems = additionalItems.length > 0

  return (
    <>
      {/* Header */}
      <div
        className={cn(
          'flex items-center bg-white px-4 py-3 dark:bg-neutral-900',
          // En desktop siempre a la derecha
          !isMobile && 'justify-end',
          // En desktop colapsado, centrar y reducir padding
          !isMobile && isCollapsed && 'lg:justify-center lg:px-2',
          // En mobile, space-between para perfil y botón cerrar
          isMobile && 'justify-between'
        )}
      >
        {/* Perfil en mobile */}
        {isMobile && (
          <div className="flex items-center gap-3">
            <Avatar src={getUserAvatarUrl(user)} initials={initials} className="size-10" />
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">{fullName}</p>
              <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">@{user.username}</p>
            </div>
          </div>
        )}

        {/* Botón toggle/cerrar */}
        <button
          onClick={() => {
            if (isMobile && onMobileClose) {
              onMobileClose()
            } else {
              setIsCollapsed(!isCollapsed)
            }
          }}
          className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          aria-label={isMobile ? t('closeMenu') : isCollapsed ? t('expandSidebar') : t('collapseSidebar')}
        >
          {isMobile ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
        </button>
      </div>

      {/* User Profile - Solo en desktop */}
      {!isMobile && (
        <div className={cn('bg-white px-4 py-3 dark:bg-neutral-900', isCollapsed && 'lg:px-2')}>
          {!isCollapsed && (
            <div className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Avatar src={getUserAvatarUrl(user)} initials={initials} className="size-10" />
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">{fullName}</p>
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">@{user.username}</p>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="flex justify-center">
              <Avatar src={getUserAvatarUrl(user)} className="size-10" />
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {/* Items siempre visibles */}
          {visibleItems.map((item) => {
            const isActive = isPathActive(item.href)
            const IconComponent = item.icon
            const showExpanded = isMobile || !isCollapsed

            return (
              <SmartLink
                key={item.href}
                href={item.href}
                title={!showExpanded ? t(item.labelKey) : undefined}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  !showExpanded && 'lg:justify-center lg:px-2',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                    : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                )}
              >
                <IconComponent
                  className={cn(
                    'h-5 w-5 shrink-0',
                    isActive ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-500 dark:text-neutral-400'
                  )}
                />

                {showExpanded && (
                  <>
                    <span className="flex-1 truncate">{t(item.labelKey)}</span>
                    {(item.badgeKey || item.badge) && (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-semibold',
                          item.badgeHideOnMobile && 'hidden sm:inline-flex',
                          isActive
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-300'
                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                        )}
                      >
                        {item.badgeKey ? t(item.badgeKey) : item.badge}
                      </span>
                    )}
                  </>
                )}

                {!showExpanded && (item.badgeKey || item.badge) && (
                  <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-red-500" />
                )}
              </SmartLink>
            )
          })}

          {/* Botón Ver más / Ver menos */}
          {hasMoreItems && (isMobile || !isCollapsed) && (
            <button
              onClick={toggleExpanded}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 transition-all duration-200 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {isExpanded ? (
                <ChevronUpIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
              )}
              <span className="flex-1 text-left">
                {isExpanded ? t('viewLess') : t('viewMoreCount', { n: additionalItems.length })}
              </span>
            </button>
          )}

          {/* Items adicionales */}
          {isExpanded &&
            (isMobile || !isCollapsed) &&
            additionalItems.map((item) => {
              const isActive = isPathActive(item.href)
              const IconComponent = item.icon

              return (
                <SmartLink
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                  )}
                >
                  <IconComponent
                    className={cn(
                      'h-5 w-5 shrink-0',
                      isActive ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-500 dark:text-neutral-400'
                    )}
                  />
                  <span className="flex-1 truncate">{t(item.labelKey)}</span>
                  {(item.badgeKey || item.badge) && (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-semibold',
                        item.badgeHideOnMobile && 'hidden sm:inline-flex',
                        isActive
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-300'
                          : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                      )}
                    >
                      {item.badgeKey ? t(item.badgeKey) : item.badge}
                    </span>
                  )}
                </SmartLink>
              )
            })}
        </div>
      </nav>
    </>
  )
}
