'use client'

import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { useState, useTransition } from 'react'
import {
  createBadge,
  updateBadge,
  softDeleteBadge,
  restoreBadge,
} from '@/features/admin/actions/badges.actions'
import type { AdminBadgeRow, BadgeFormInput } from '@/features/admin/types/badges.types'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function extractCfId(deliveryUrl: string): string | null {
  // imagedelivery.net/<hash>/<id>/<variant>
  const m = /imagedelivery\.net\/[^/]+\/([^/]+)\//.exec(deliveryUrl)
  return m?.[1] ?? null
}

/**
 * Form state + submit/delete/restore handlers for `BadgeForm`. Owns the dozen
 * field states and the slug auto-fill so the component is purely the form
 * layout. Mirrors the `mode`/`initial` props the form receives.
 */
export function useBadgeForm(mode: 'create' | 'edit', initial?: AdminBadgeRow | null) {
  const router = useRouter()
  const isSystem = Boolean(initial?.isSystem)

  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState(initial?.category ?? 'engineering')
  const [slot, setSlot] = useState<'insignia' | 'badge'>(initial?.slot ?? 'insignia')
  const [visibility, setVisibility] = useState<'public' | 'private'>(initial?.visibility ?? 'public')
  const [tier, setTier] = useState(initial?.tier ?? '')
  const [isUnique, setIsUnique] = useState(initial?.isUnique ?? false)
  const [requestable, setRequestable] = useState(initial?.requestable ?? false)
  const [autoAccept, setAutoAccept] = useState(initial?.autoAccept ?? false)
  const [evidenceRequired, setEvidenceRequired] = useState(initial?.evidenceRequired ?? false)
  const [requirementsMd, setRequirementsMd] = useState(initial?.requirementsMd ?? '')
  const [icon, setIcon] = useState<{ cfImageId: string | null; url: string | null }>({
    cfImageId: null,
    url: initial?.iconUrl ?? null,
  })
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleNameChange = (v: string) => {
    setName(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const payload: BadgeFormInput = {
      slug,
      name,
      description,
      iconCfImageId: icon.cfImageId ?? (initial?.iconUrl ? extractCfId(initial.iconUrl) : null),
      category,
      slot,
      visibility,
      tier: tier || null,
      isUnique,
      requestable,
      autoAccept,
      evidenceRequired,
      requirementsMd,
    }
    startTransition(async () => {
      try {
        if (mode === 'create') {
          const res = await createBadge(payload)
          if (!res.ok) throw new Error(res.error)
          router.push(`/admin/badges/${res.data.slug}` as Route)
        } else if (initial) {
          const res = await updateBadge({ ...payload, id: initial.id, previousSlug: initial.slug })
          if (!res.ok) throw new Error(res.error)
          if (res.data.slug !== initial.slug) router.push(`/admin/badges/${res.data.slug}` as Route)
          else router.refresh()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      }
    })
  }

  const handleDelete = () => {
    if (!initial || isSystem) return
    if (!confirm(`Eliminar la insignia "${initial.name}"?`)) return
    startTransition(async () => {
      const res = await softDeleteBadge(initial.id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.push('/admin/badges' as Route)
    })
  }

  const handleRestore = () => {
    if (!initial) return
    startTransition(async () => {
      const res = await restoreBadge(initial.id)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })
  }

  return {
    isSystem,
    name,
    handleNameChange,
    slug,
    setSlug,
    setSlugTouched,
    description,
    setDescription,
    category,
    setCategory,
    slot,
    setSlot,
    visibility,
    setVisibility,
    tier,
    setTier,
    isUnique,
    setIsUnique,
    requestable,
    setRequestable,
    autoAccept,
    setAutoAccept,
    evidenceRequired,
    setEvidenceRequired,
    requirementsMd,
    setRequirementsMd,
    icon,
    setIcon,
    pending,
    error,
    handleSubmit,
    handleDelete,
    handleRestore,
  }
}
