'use client'

import { useState } from 'react'
import { Bars3Icon, XMarkIcon } from '@/components/icons/heroicons-shim'
import AdminSidebar from './AdminSidebar'

interface Props {
  children: React.ReactNode
}

export default function AdminShell({ children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

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
          <div className="absolute top-0 bottom-0 left-0 w-64 bg-white shadow-xl dark:bg-neutral-900">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-semibold">Admin</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Cerrar menú"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <AdminSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 lg:hidden dark:border-neutral-800 dark:bg-neutral-900">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Abrir menú"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold">Admin</span>
        </header>
        <main className="flex-1 overflow-x-auto">{children}</main>
      </div>
    </div>
  )
}
