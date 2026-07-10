'use client'

import { useCallback, useEffect, useState } from 'react'
import { grantPageBadge, revokePageBadge } from '@/features/admin/actions/badges.actions'
import { PageBadgeGrantsList, type PageBadgeGrant } from './PageBadgeGrantsList'
import { PageBadgeGrantForm } from './PageBadgeGrantForm'

/** Slim catalog row passed down from /admin/paginas (mapped from AdminBadgeRow). */
export interface PageBadgeCatalogItem {
  id: string
  slug: string
  name: string
  tier: string | null
  iconUrl: string | null
}

const ERROR_COPY: Record<string, string> = {
  already_granted: 'La página ya tiene esta insignia activa.',
  badge_not_found: 'Insignia no encontrada en el catálogo.',
  badge_deleted: 'Esa insignia está eliminada del catálogo.',
  page_not_found: 'Página no encontrada.',
  not_found: 'Asignación no encontrada.',
  already_revoked: 'Esa asignación ya estaba revocada.',
  revoke_no_rows: 'No se pudo revocar la asignación. Recarga e intenta de nuevo.',
  missing_args: 'Faltan datos para asignar la insignia.',
}

interface Props {
  pageId: string
  pageName: string
  catalog: PageBadgeCatalogItem[]
  onClose: () => void
}

/**
 * Modal for granting/revoking catalog badges on a Página. Active grants are
 * read from the same endpoint that feeds the public strip
 * (`/api/pages/[idOrSlug]/badges`) so this view can't drift from it.
 */
export function PageBadgesDialog({ pageId, pageName, catalog, onClose }: Props) {
  const [grants, setGrants] = useState<PageBadgeGrant[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadGrants = useCallback(async () => {
    try {
      const res = await fetch(`/api/pages/${pageId}/badges`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = (await res.json()) as { badges?: PageBadgeGrant[] }
      setGrants(body.badges ?? [])
    } catch {
      setError('No se pudieron cargar las insignias de la página.')
    } finally {
      setLoading(false)
    }
  }, [pageId])

  useEffect(() => {
    void loadGrants()
  }, [loadGrants])

  const activeBadgeIds = new Set(
    grants.flatMap((g) => (g.badge ? [g.badge.id] : []))
  )

  const handleGrant = async (badgeId: string, reason: string): Promise<boolean> => {
    setError(null)
    setBusy(true)
    try {
      const res = await grantPageBadge({ badgeId, pageId, reason: reason.trim() || null })
      if (!res.ok) {
        setError(ERROR_COPY[res.error] ?? res.error)
        return false
      }
      await loadGrants()
      return true
    } finally {
      setBusy(false)
    }
  }

  const handleRevoke = async (grantId: string): Promise<void> => {
    setError(null)
    setBusy(true)
    try {
      const res = await revokePageBadge({ grantId })
      if (!res.ok) {
        setError(ERROR_COPY[res.error] ?? res.error)
        return
      }
      await loadGrants()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-neutral-900">
        <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <h2 className="text-lg font-bold">Insignias · {pageName}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            ✕
          </button>
        </header>
        <div className="space-y-4 p-4">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Insignias activas
            </h3>
            {loading ? (
              <p className="mt-1 text-sm text-neutral-500">Cargando…</p>
            ) : (
              <PageBadgeGrantsList grants={grants} busy={busy} onRevoke={handleRevoke} />
            )}
          </section>
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Asignar del catálogo
            </h3>
            <PageBadgeGrantForm
              catalog={catalog}
              activeBadgeIds={activeBadgeIds}
              busy={busy || loading}
              onGrant={handleGrant}
            />
          </section>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  )
}
