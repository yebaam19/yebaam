'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { toast } from 'sonner'
import type { AdminPageRow } from '@/features/admin/server/pages.server'
import { setPageVerified, softRestrictPage } from '@/features/admin/actions/pages-admin.actions'
import {
  PageBadgesDialog,
  type PageBadgeCatalogItem,
} from './badges/PageBadgesDialog'

export function AdminPagesTable({
  pages,
  badgeCatalog,
}: {
  pages: AdminPageRow[]
  badgeCatalog: PageBadgeCatalogItem[]
}) {
  const [pending, start] = useTransition()
  const [badgePage, setBadgePage] = useState<AdminPageRow | null>(null)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="border-b border-neutral-200 dark:border-neutral-800 text-left text-xs uppercase text-neutral-500">
          <tr>
            <th className="px-4 py-3">Página</th>
            <th className="px-4 py-3">Categoría</th>
            <th className="px-4 py-3">Dueño</th>
            <th className="px-4 py-3">Seguidores</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((p) => (
            <tr
              key={p.id}
              className="border-b border-neutral-100 dark:border-neutral-800/60"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/paginas/${p.slug}` as Route}
                  className="font-medium text-primary-700 hover:underline dark:text-primary-300"
                >
                  {p.name}
                </Link>
                <p className="text-xs text-neutral-500">/{p.slug}</p>
              </td>
              <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                {p.category ?? '—'}
              </td>
              <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                {p.ownerUsername ? `@${p.ownerUsername}` : '—'}
              </td>
              <td className="px-4 py-3">{p.followerCount}</td>
              <td className="px-4 py-3">
                <span className="text-xs">
                  {p.isVerified ? '✓ Verificada · ' : ''}
                  {p.privacy}
                </span>
              </td>
              <td className="px-4 py-3 space-x-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const res = await setPageVerified({
                        pageId: p.id,
                        verified: !p.isVerified,
                      })
                      if (!res.ok) toast.error(res.error ?? 'Error')
                      else toast.success(p.isVerified ? 'Verificación quitada' : 'Página verificada')
                    })
                  }
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  {p.isVerified ? 'Quitar verif.' : 'Verificar'}
                </button>
                <button
                  type="button"
                  onClick={() => setBadgePage(p)}
                  className="text-xs font-medium text-amber-600 hover:underline"
                >
                  Insignias
                </button>
                {p.privacy === 'public' && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const res = await softRestrictPage({ pageId: p.id })
                        if (!res.ok) toast.error(res.error ?? 'Error')
                        else toast.success('Página restringida')
                      })
                    }
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Restringir
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {pages.length === 0 && (
        <p className="p-6 text-sm text-neutral-500">No hay páginas.</p>
      )}
      {badgePage && (
        <PageBadgesDialog
          pageId={badgePage.id}
          pageName={badgePage.name}
          catalog={badgeCatalog}
          onClose={() => setBadgePage(null)}
        />
      )}
    </div>
  )
}
