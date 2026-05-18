'use client'

import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import { Bars3Icon } from '@/components/icons/heroicons-shim'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Route } from 'next'
import { Fragment } from 'react'
import { useTranslations } from 'next-intl'
import {
  PORTAL_SECTIONS,
  resolveHref,
} from '@/features/cities/data/portal-sections'
import { getPortalIcon } from './portal/icons'

interface CityMenuProps {
  citySlug: string
}

/**
 * Mobile floating-action menu for the City Portal.
 *
 * Phase 2 removed the desktop sidebar — the 27-tile grid IS the desktop nav.
 * What stays is the FAB at the bottom-right on `< lg` viewports: a quick-jump
 * dropdown that mirrors the same portal sections as the grid, so users on
 * phones do not have to scroll a 27-cell single column to reach the bottom
 * tiles.
 */
export function CityMenu({ citySlug }: CityMenuProps) {
  const pathname = usePathname()
  const t = useTranslations('cities.portal')

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <div className="fixed right-5 bottom-24 z-40 lg:hidden">
      <Menu as="div" className="relative">
        <MenuButton className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none">
          <Bars3Icon className="h-6 w-6" />
        </MenuButton>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <MenuItems className="absolute right-0 bottom-full mb-2 max-h-[60vh] w-64 origin-bottom-right overflow-y-auto rounded-xl bg-white py-2 shadow-xl ring-1 ring-black/5 focus:outline-none dark:bg-neutral-800 dark:ring-white/10">
            {PORTAL_SECTIONS.map((section) => {
              const Icon = getPortalIcon(section.icon)
              const href = resolveHref(section, citySlug)
              const active = isActive(href)
              return (
                <MenuItem key={section.id}>
                  {({ focus }) => (
                    <Link
                      href={href as Route}
                      className={`flex items-center gap-3 px-4 py-3 text-sm ${
                        active
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                          : focus
                            ? 'bg-neutral-100 dark:bg-neutral-700'
                            : 'text-neutral-700 dark:text-neutral-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="flex-1">
                        {t(`sections.${section.id}.label`)}
                      </span>
                      {section.comingSoon && (
                        <span className="text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400">
                          {t('comingSoonPill')}
                        </span>
                      )}
                    </Link>
                  )}
                </MenuItem>
              )
            })}
          </MenuItems>
        </Transition>
      </Menu>
    </div>
  )
}
