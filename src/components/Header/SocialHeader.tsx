'use client'

import { isFeatureEnabled, type FeatureFlag } from '@/config/features-flag'
import { NotificationBell } from '@/features/notification'
import YebaamLogo from '@/images/brand/Yebaam-Logo.png'
import YebaamLogoLight from '@/images/brand/Logo-Yebaam_white.png'
import { cn } from '@/lib/utils'
import {
  Bars3Icon,
  HomeIcon,
  MagnifyingGlassIcon,
  NewspaperIcon,
  PlayIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@/components/icons/heroicons-shim'
import {
  HomeIcon as HomeIconSolid,
  NewspaperIcon as NewspaperIconSolid,
  PlayIcon as PlayIconSolid,
  UserGroupIcon as UserGroupIconSolid,
} from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'
import { useTranslations } from 'next-intl'

import AvatarDropdown from './AvatarDropdown'
import { HeaderSearchDropdown } from './HeaderSearchDropdown'
import MessengerDropdown from './MessengerDropdown'
import type { Route } from 'next';

interface SocialHeaderProps {
  onMobileMenuClick?: () => void
  isPlatformAdmin?: boolean
}

export default function SocialHeader({ onMobileMenuClick, isPlatformAdmin }: SocialHeaderProps) {
  const pathname = usePathname()
  const tHeader = useTranslations('header')
  const tNav = useTranslations('nav')
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)

  const handleToggleMobileSearch = useCallback(() => {
    setIsMobileSearchOpen((prev) => !prev)
  }, [])

  const handleCloseMobileSearch = useCallback(() => {
    setIsMobileSearchOpen(false)
  }, [])

  const isSearchPage = pathname?.startsWith('/search')

  // Navigation items con iconos outline y solid
  const navItems = [
    {
      href: '/feed',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      label: tNav('home'),
      isActive: pathname === '/feed',
    },
    {
      href: '/watch',
      icon: PlayIcon,
      iconSolid: PlayIconSolid,
      label: tNav('videos'),
      isActive: pathname?.startsWith('/watch'),
      featureFlag: 'VIDEOS_ENABLED' as FeatureFlag,
    },
    {
      href: '/grupos',
      icon: UserGroupIcon,
      iconSolid: UserGroupIconSolid,
      label: tNav('groups'),
      isActive: pathname?.startsWith('/grupos') || pathname?.startsWith('/groups'),
      featureFlag: 'GRUPOS_ENABLED' as FeatureFlag,
    },
    {
      href: '/foro',
      icon: NewspaperIcon,
      iconSolid: NewspaperIconSolid,
      label: tNav('forum'),
      isActive: pathname?.startsWith('/foro'),
      featureFlag: 'FOROS_ENABLED' as FeatureFlag,
    },
  ].filter((item) => !item.featureFlag || isFeatureEnabled(item.featureFlag))

  return (
    <>
      <header className="fixed top-0 right-0 left-0 z-50 bg-white pt-[env(safe-area-inset-top)] shadow-sm dark:bg-neutral-900">
        <div className="mx-auto flex h-14 max-w-full min-w-0 items-center justify-between gap-2 px-2 sm:px-4">
          {/* Left Section - Menu + Logo */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={onMobileMenuClick}
              className="rounded-lg p-2 transition-colors hover:bg-neutral-100 lg:hidden dark:hover:bg-neutral-800"
              aria-label={tHeader('openMenu')}
            >
              <Bars3Icon className="h-6 w-6 text-neutral-700 dark:text-neutral-300" />
            </button>

            {/* Logo - Responsive sizes */}
            <Link href={'/feed' as Route} className="flex h-7 shrink-0 items-center sm:h-8">
              {/* Green wordmark on the light header; cream wordmark in dark mode */}
              <Image
                src={YebaamLogo}
                alt="Yebaam"
                className="h-full w-auto dark:hidden"
                style={{ width: 'auto' }}
                priority
                unoptimized
              />
              <Image
                src={YebaamLogoLight}
                alt="Yebaam"
                className="hidden h-full w-auto dark:block"
                style={{ width: 'auto' }}
                priority
                unoptimized
              />
            </Link>

            {/* Search Bar - Desktop Only */}
            {!isSearchPage && (
              <div className="ml-4 hidden md:flex lg:ml-8">
                <HeaderSearchDropdown />
              </div>
            )}
          </div>

          {/* Center Section - Navigation Icons (Desktop only) */}
          <nav className="hidden min-w-0 max-w-2xl flex-1 items-center justify-center lg:flex">
            {navItems.map((item) => {
              const Icon = item.isActive ? item.iconSolid : item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href as Route}
                  className={cn(
                    'relative flex h-14 items-center justify-center px-8 xl:px-10',
                    'transition-all duration-200',
                    'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                    item.isActive ? 'text-primary-600' : 'text-neutral-600 dark:text-neutral-400'
                  )}
                  title={item.label}
                >
                  <Icon className="h-6 w-6 xl:h-7 xl:w-7" />
                  {item.isActive && (
                    <div className="absolute right-0 bottom-0 left-0 h-1 rounded-t-md bg-primary-600" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right Section - Actions */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            {/* Mobile Search Button */}
            {!isSearchPage && (
              <button
                onClick={handleToggleMobileSearch}
                className="rounded-full p-2 transition-colors hover:bg-neutral-100 md:hidden dark:hover:bg-neutral-800"
                aria-label={tHeader('search')}
              >
                <MagnifyingGlassIcon className="h-6 w-6 text-neutral-700 dark:text-neutral-300" />
              </button>
            )}

            {/* Messages */}
            <MessengerDropdown />

            {/* Notifications */}
            <NotificationBell />

            {/* User Avatar Dropdown */}
            <div className="ml-1 sm:ml-2">
              <AvatarDropdown isPlatformAdmin={isPlatformAdmin} />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseMobileSearch} />

          {/* Search Panel */}
          <div className="animate-in slide-in-from-top absolute top-0 right-0 left-0 bg-white p-4 pt-[max(1rem,env(safe-area-inset-top))] shadow-lg duration-200 dark:bg-neutral-900">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCloseMobileSearch}
                className="shrink-0 rounded-full p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label={tHeader('closeSearch')}
              >
                <XMarkIcon className="h-6 w-6 text-neutral-700 dark:text-neutral-300" />
              </button>
              <div className="flex-1">
                <HeaderSearchDropdown />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
