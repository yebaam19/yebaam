'use client'

import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { useState, useTransition } from 'react'
import { BadgeIconField } from './BadgeIconField'
import {
  createBadge,
  updateBadge,
  softDeleteBadge,
  restoreBadge,
} from '@/features/admin/actions/badges.actions'
import type { AdminBadgeRow, BadgeFormInput } from '@/features/admin/types/badges.types'
import {
  BADGE_CATEGORY_OPTIONS,
  BADGE_REQUIREMENTS_PLACEHOLDER,
  BADGE_TIER_PLACEHOLDER,
} from '@/features/badges/lib/badgeTaxonomy'

interface Props {
  mode: 'create' | 'edit'
  initial?: AdminBadgeRow | null
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function BadgeForm({ mode, initial }: Props) {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Nombre</label>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            disabled={isSystem}
            placeholder={mode === 'create' ? 'Ingeniero de software' : undefined}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Slug</label>
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
            required
            disabled={isSystem}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-950"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Descripción (tooltip)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Perfil técnico verificado con experiencia demostrable en desarrollo de software."
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Ícono</label>
        <BadgeIconField value={icon} onChange={setIcon} disabled={pending} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Slot</label>
          <select
            value={slot}
            onChange={(e) => setSlot(e.target.value as 'insignia' | 'badge')}
            disabled={isSystem}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          >
            <option value="insignia">Insignia (junto al nombre)</option>
            <option value="badge">Badge (franja inferior)</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          >
            {BADGE_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Nivel / tier</label>
          <input
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            placeholder={BADGE_TIER_PLACEHOLDER}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={visibility === 'public'} onChange={(e) => setVisibility(e.target.checked ? 'public' : 'private')} />
          Visible públicamente
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isUnique} onChange={(e) => setIsUnique(e.target.checked)} disabled={isSystem} />
          Única por usuario
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={requestable} onChange={(e) => setRequestable(e.target.checked)} />
          Solicitable por usuarios
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={autoAccept} onChange={(e) => setAutoAccept(e.target.checked)} disabled={isSystem} />
          Aceptación automática
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Requisitos (Markdown, opcional)</label>
        <textarea
          value={requirementsMd}
          onChange={(e) => setRequirementsMd(e.target.value)}
          rows={4}
          placeholder={BADGE_REQUIREMENTS_PLACEHOLDER}
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-950"
        />
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
        >
          {pending ? 'Guardando…' : mode === 'create' ? 'Crear' : 'Guardar cambios'}
        </button>
        {mode === 'edit' && initial && !isSystem && (
          <div className="flex items-center gap-2">
            {initial.deletedAt ? (
              <button
                type="button"
                onClick={handleRestore}
                disabled={pending}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium dark:border-neutral-700"
              >
                Restaurar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 dark:border-red-800 dark:text-red-300"
              >
                Eliminar
              </button>
            )}
          </div>
        )}
      </div>
    </form>
  )
}

function extractCfId(deliveryUrl: string): string | null {
  // imagedelivery.net/<hash>/<id>/<variant>
  const m = /imagedelivery\.net\/[^/]+\/([^/]+)\//.exec(deliveryUrl)
  return m?.[1] ?? null
}
