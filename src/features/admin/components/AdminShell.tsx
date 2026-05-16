'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import { Bars3Icon, XMarkIcon } from '@/components/icons/heroicons-shim'
import AdminSidebar from './AdminSidebar'
import YebaamLogo from '@/images/brand/Yebaam-Logo.svg'
import { useTranslations } from 'next-intl'

interface Props {
  children: React.ReactNode
}

export default function AdminShell({ children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const t = useTranslations('admin.shell')

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-neutral-200 bg-white lg:block dark:border-neutral-800 dark:bg-neutral-900">
        <AdminSidebar />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-0 bottom-0 left-0 flex w-64 flex-col bg-white shadow-xl dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <Link href={'/feed' as Route} className="flex h-6 shrink-0 items-center">
                <Image
                  src={YebaamLogo}
                  alt="Yebaam"
                  className="h-full w-auto"
                  style={{ width: 'auto' }}
                />
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label={t('closeMenu')}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <AdminSidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 lg:hidden dark:border-neutral-800 dark:bg-neutral-900">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label={t('openMenu')}
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <Link href={'/feed' as Route} className="flex h-6 shrink-0 items-center">
            <Image
              src={YebaamLogo}
              alt="Yebaam"
              className="h-full w-auto"
              style={{ width: 'auto' }}
            />
          </Link>
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary-700 uppercase dark:bg-primary-900/30 dark:text-primary-300">
            {t('adminBadge')}
          </span>
        </header>
        <main className="flex-1 overflow-x-auto">{children}</main>
      </div>
    </div>
  )
}
