'use client'

import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import {
  Bars3Icon,
  BookOpenIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  HeartIcon,
  MegaphoneIcon,
  NewspaperIcon,
  TagIcon,
  UserGroupIcon,
} from '@/components/icons/heroicons-shim'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment } from 'react'
import { getCityMenuItems } from '../data/categories'

interface CityMenuProps {
  citySlug: string
}

/**
 * Mapa de iconos para el menú
 */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ChatBubbleLeftRightIcon,
  TagIcon,
  NewspaperIcon,
  BookOpenIcon,
  UserGroupIcon,
  ChatBubbleBottomCenterTextIcon,
  MegaphoneIcon,
  HeartIcon,
  EnvelopeIcon,
}

/**
 * Menú lateral de opciones de ciudad
 */
export function CityMenu({ citySlug }: CityMenuProps) {
  const pathname = usePathname()
  const menuItems = getCityMenuItems(citySlug)

  const getIsActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Menú Desktop */}
      <aside className="hidden flex-col space-y-2 lg:flex">
        {menuItems.map((item) => {
          const IconComponent = iconMap[item.icon] || ChatBubbleLeftRightIcon
          const isActive = getIsActive(item.href)

          return (
            <Link
              key={item.id}
              href={item.isComingSoon ? '#' : item.href}
              className={`group flex items-center gap-3 rounded-xl border p-4 transition-all ${
                isActive
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'border-neutral-200 bg-white hover:border-primary-300 hover:bg-primary-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-primary-600 dark:hover:bg-primary-900/20'
              } ${item.isComingSoon ? 'cursor-not-allowed opacity-60' : ''}`}
              onClick={(e) => item.isComingSoon && e.preventDefault()}
            >
              <IconComponent
                className={`h-5 w-5 ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-neutral-500 group-hover:text-primary-600 dark:text-neutral-400 dark:group-hover:text-primary-400'
                }`}
              />
              <span className="text-sm font-medium">{item.label}</span>
              {item.isComingSoon && (
                <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Pronto
                </span>
              )}
            </Link>
          )
        })}
      </aside>

      {/* Menú Mobile - Floating Button */}
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
            <MenuItems className="absolute right-0 bottom-full mb-2 w-56 origin-bottom-right rounded-xl bg-white py-2 shadow-xl ring-1 ring-black/5 focus:outline-none dark:bg-neutral-800 dark:ring-white/10">
              {menuItems.map((item) => {
                const IconComponent = iconMap[item.icon] || ChatBubbleLeftRightIcon
                const isActive = getIsActive(item.href)

                return (
                  <MenuItem key={item.id}>
                    {({ focus }) => (
                      <Link
                        href={item.isComingSoon ? '#' : item.href}
                        onClick={(e) => item.isComingSoon && e.preventDefault()}
                        className={`flex items-center gap-3 px-4 py-3 text-sm ${
                          isActive
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                            : focus
                              ? 'bg-neutral-100 dark:bg-neutral-700'
                              : 'text-neutral-700 dark:text-neutral-200'
                        } ${item.isComingSoon ? 'opacity-60' : ''}`}
                      >
                        <IconComponent className="h-5 w-5" />
                        <span>{item.label}</span>
                        {item.isComingSoon && (
                          <span className="ml-auto text-xs text-amber-600 dark:text-amber-400">Pronto</span>
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
    </>
  )
}
