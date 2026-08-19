'use client'

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { usePathname } from 'next/navigation'
import React, { Fragment, useEffect, useMemo, useRef } from 'react'

import { getMenuForUser } from '@/config/menuConfig'
import { AuthUser } from '@/features/auth/interfaces/auth.interfaces'
import { cn } from '@/lib/utils'
import { useMenuBadges } from './hooks/useMenuBadges'
import { useSidebar } from './hooks/useSidebar'
import { useSidebarExpanded } from './hooks/useSidebarExpanded'
import { SidebarContent } from './SidebarContent'

// 11 so the El Umbral entry fits without demoting Artistas below "Ver más".
const MAX_VISIBLE_ITEMS = 11

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

  // Cerrar el sidebar móvil solo cuando cambia la ruta (navegación)
  useEffect(() => {
    if (previousPathname.current !== pathname && isMobileOpen && onMobileClose) {
      onMobileClose()
    }
    previousPathname.current = pathname
  }, [pathname, isMobileOpen, onMobileClose])

  const basePath = '/feed'

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

  const contentProps = {
    user,
    isCollapsed,
    setIsCollapsed,
    onMobileClose,
    visibleItems,
    additionalItems,
    isExpanded,
    toggleExpanded,
    isPathActive,
  }

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
              <SidebarContent {...contentProps} isMobile />
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
        <SidebarContent {...contentProps} />
      </div>
    </>
  )
}

export default Sidebar
