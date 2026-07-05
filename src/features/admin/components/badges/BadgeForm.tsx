'use client'

import { BadgeIconField } from './BadgeIconField'
import { useBadgeForm } from './useBadgeForm'
import type { AdminBadgeRow } from '@/features/admin/types/badges.types'
import {
  BADGE_CATEGORY_OPTIONS,
  BADGE_REQUIREMENTS_PLACEHOLDER,
  BADGE_TIER_PLACEHOLDER,
} from '@/features/badges/lib/badgeTaxonomy'

interface Props {
  mode: 'create' | 'edit'
  initial?: AdminBadgeRow | null
}

export function BadgeForm({ mode, initial }: Props) {
  const {
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
  } = useBadgeForm(mode, initial)

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
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={evidenceRequired} onChange={(e) => setEvidenceRequired(e.target.checked)} />
          Evidencia obligatoria (solicitudes deben adjuntar documentos)
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
