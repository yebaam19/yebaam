/**
 * PortalMenu Component
 *
 * Menú lateral de navegación del portal con soporte para móvil
 */

'use client'

import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { PortalMenuItem } from '../interfaces'

interface MenuItemProps {
  icon: React.ReactNode
  label: string
  href: string
  isActive: boolean
  isComingSoon?: boolean
}

function MenuItem({ icon, label, href, isActive, isComingSoon }: MenuItemProps) {
  const content = (
    <div
      className={`group flex items-center gap-3 rounded-xl border p-4 transition-all ${
        isActive
          ? 'border-amber-500 bg-linear-to-r from-red-500 to-amber-500 text-white shadow-lg hover:shadow-xl'
          : 'border-neutral-200 bg-white hover:border-amber-400 hover:bg-linear-to-r hover:from-red-500/10 hover:to-amber-500/10 dark:border-neutral-700 dark:bg-neutral-800'
      } ${isComingSoon ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <div className={`transition-colors ${isActive ? 'text-white' : 'text-amber-600 group-hover:text-amber-700'}`}>
        {icon}
      </div>
      <span
        className={`text-sm font-medium ${
          isActive ? 'text-white' : 'text-neutral-900 group-hover:text-amber-700 dark:text-neutral-100'
        }`}
      >
        {label}
      </span>
      {isComingSoon && (
        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          Pronto
        </span>
      )}
    </div>
  )

  if (isComingSoon) {
    return <div className="block">{content}</div>
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  )
}

interface PortalMenuProps {
  portalSlug: string
  menuItems: PortalMenuItem[]
}

export function PortalMenu({ portalSlug, menuItems }: PortalMenuProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const getIsActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  return (
    <>
      {/* Desktop Menu */}
      <aside className="hidden w-64 shrink-0 flex-col space-y-3 lg:flex">
        {menuItems.map((item, index) => (
          <MenuItem
            key={index}
            icon={item.icon}
            label={item.label}
            href={item.href}
            isActive={getIsActive(item.href)}
            isComingSoon={item.isComingSoon}
          />
        ))}
      </aside>

      {/* Mobile Menu Button */}
      <div className="fixed right-5 bottom-20 z-40 flex sm:bottom-10 lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-500 bg-linear-to-br from-red-500 to-amber-500 text-white shadow-xl hover:shadow-2xl focus:outline-none"
        >
          {isOpen ? <XMarkIcon className="size-6" /> : <Bars3Icon className="size-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setIsOpen(false)} />
          <div className="fixed right-5 bottom-36 z-40 w-64 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl sm:bottom-24 lg:hidden dark:border-neutral-700 dark:bg-neutral-900">
            <div className="space-y-1">
              {menuItems.map((item, index) => {
                const isActive = getIsActive(item.href)
                const content = (
                  <div
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                      isActive
                        ? 'bg-linear-to-r from-red-500 to-amber-500 text-white hover:from-red-600 hover:to-amber-600'
                        : 'hover:bg-amber-50 dark:hover:bg-neutral-800'
                    } ${item.isComingSoon ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.isComingSoon && (
                      <span className="ml-auto text-xs text-amber-600 dark:text-amber-400">Pronto</span>
                    )}
                  </div>
                )

                if (item.isComingSoon) {
                  return (
                    <div key={index} onClick={(e) => e.preventDefault()}>
                      {content}
                    </div>
                  )
                }

                return (
                  <Link key={index} href={item.href} onClick={() => setIsOpen(false)}>
                    {content}
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
