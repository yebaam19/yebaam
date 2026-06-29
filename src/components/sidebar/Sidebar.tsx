'use client'

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { Bars3Icon, ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { Fragment, useEffect, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'

import { getMenuForUser } from '@/config/menuConfig'
import { AuthUser } from '@/features/auth/interfaces/auth.interfaces'
import { getUserInitials, getUserDisplayName } from '@/lib/user-helpers'
import { cn } from '@/lib/utils'
import { getUserAvatarUrl } from '@/lib/utils/avatar'
import Avatar from '@/ui/Avatar'
import { useMenuBadges } from './hooks/useMenuBadges'
import { useSidebar } from './hooks/useSidebar'
import { useSidebarExpanded } from './hooks/useSidebarExpanded'

const MAX_VISIBLE_ITEMS = 10

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
  return (
    <Link href={href as never} className={className} title={title}>
      {children}
    </Link>
  )
}

interface SidebarProps {
  className?: string
  user: AuthUser
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ className, user, isMobileOpen = false, onMobileClose }) => {
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const { isExpanded, toggleExpanded } = useSidebarExpanded()
  const pathname = usePathname()
  const previousPathname = useRef(pathname)
  const t = useTranslations('nav')

  // Cerrar el sidebar móvil solo cuando cambia la ruta (navegación)
  useEffect(() => {
    if (previousPathname.current !== pathname && isMobileOpen && onMobileClose) {
      onMobileClose()
    }
    previousPathname.current = pathname
  }, [pathname, isMobileOpen, onMobileClose])

  const basePath = '/feed'

  const fullName = getUserDisplayName(user)
  const initials = getUserInitials(fullName)

  // Obtener badges dinámicos
  const badges = useMenuBadges()

  // Obtener la configuración del menú con rutas dinámicas y badges
  const userMenuConfig = useMemo(() => {
    const menu = getMenuForUser('USER', basePath, badges, user.username)
    return menu
  }, [basePath, badges, user.username])

  // Aplanar todos los items de todas las secciones.
  // El item "Mis Negocios" se sobreescribe aquí porque su label/href dependen
  // de si el usuario administra algún negocio (myBusinessesCount), algo que
  // getMenuForUser no puede resolver de forma estática.
  const allItems = useMemo(() => {
    const items = userMenuConfig.flatMap((section) => section.items)
    return items.map((item: any) => {
      if (item.href !== '/feed/mis-negocios') return item
      if (badges.myBusinessesCount > 0) {
        return { ...item, badge: String(badges.myBusinessesCount) }
      }
      return { ...item, labelKey: 'items.registrarNegocio', href: '/negocios/crear' }
    })
  }, [userMenuConfig, badges.myBusinessesCount])

  // Dividir items en visibles y adicionales
  const visibleItems = useMemo(() => allItems.slice(0, MAX_VISIBLE_ITEMS), [allItems])
  const additionalItems = useMemo(() => allItems.slice(MAX_VISIBLE_ITEMS), [allItems])
  const hasMoreItems = additionalItems.length > 0

  const isPathActive = (href: string) => {
    // Normalizar pathname y href eliminando trailing slashes
    const normalizedPathname = pathname.replace(/\/$/, '')
    const normalizedHref = href.replace(/\/$/, '')

    // Coincidencia exacta
    if (normalizedPathname === normalizedHref) return true

    // Si es la ruta base (dashboard), solo activar en coincidencia exacta
    if (normalizedHref === basePath) {
      return normalizedPathname === basePath
    }

    // Para otras rutas, verificar que sea un subroute
    if (normalizedHref !== basePath && normalizedHref !== '') {
      return normalizedPathname.startsWith(normalizedHref + '/')
    }

    return false
  }

  // Contenido del sidebar (compartido entre mobile y desktop)
  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
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

  return (
    <>
      {/* Mobile Sidebar - Dialog */}
      <Transition show={isMobileOpen} as={Fragment}>
        <Dialog onClose={() => onMobileClose?.()} className="relative z-50 lg:hidden">
          {/* Overlay */}
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
          </TransitionChild>

          {/* Panel */}
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <DialogPanel className="fixed inset-y-0 left-0 flex w-[min(16rem,85vw)] max-w-full flex-col bg-white shadow-xl dark:bg-neutral-900">
              <SidebarContent isMobile />
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          'fixed top-[calc(3.5rem+env(safe-area-inset-top,0px))] left-0 z-40 hidden h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] flex-col border-r border-neutral-200 bg-white transition-all duration-300 ease-in-out lg:flex dark:border-neutral-800 dark:bg-neutral-900',
          isCollapsed ? 'w-20' : 'w-64',
          className
        )}
      >
        <SidebarContent />
      </div>
    </>
  )
}

export default Sidebar
