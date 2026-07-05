'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { PlusIcon } from '@/components/icons/heroicons-shim'
import {
  addOfferingAction,
  deleteOfferingAction,
  updateOfferingAction,
  type OfferingInput,
} from '../../../actions/offerings.actions'
import type { ServiceOffering } from '../../../server/offerings.server'
import { OfferingCard } from './OfferingCard'
import { OfferingForm } from './OfferingForm'

export interface OfferingsSectionProps {
  serviceId: string
  /** El dueño puede agregar, editar y eliminar sus sub-servicios. */
  isOwner: boolean
  initialOfferings: ServiceOffering[]
}

/**
 * Sección "Servicios" del perfil: lista los sub-servicios que ofrece el
 * profesional. El dueño gestiona la lista inline (optimista + router.refresh()).
 */
export function OfferingsSection({ serviceId, isOwner, initialOfferings }: OfferingsSectionProps) {
  const router = useRouter()
  const [offerings, setOfferings] = useState(initialOfferings)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Re-sincroniza la lista optimista cuando el server refresca los props
  // (patrón "ajustar estado durante el render" — sin setState en efectos).
  const [prevInitial, setPrevInitial] = useState(initialOfferings)
  if (initialOfferings !== prevInitial) {
    setPrevInitial(initialOfferings)
    setOfferings(initialOfferings)
  }

  const handleAdd = async (values: OfferingInput) => {
    setBusy(true)
    setError(null)
    const result = await addOfferingAction(serviceId, values)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setOfferings((prev) => [...prev, result.data])
    setAdding(false)
    router.refresh()
  }

  const handleUpdate = async (id: string, values: OfferingInput) => {
    setBusy(true)
    setError(null)
    const result = await updateOfferingAction(id, values)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setOfferings((prev) => prev.map((o) => (o.id === id ? result.data : o)))
    setEditingId(null)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este servicio? Esta acción no se puede deshacer.')) return
    setDeletingId(id)
    setError(null)
    const result = await deleteOfferingAction(id)
    setDeletingId(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setOfferings((prev) => prev.filter((o) => o.id !== id))
    router.refresh()
  }

  const startAdding = () => {
    setAdding(true)
    setEditingId(null)
    setError(null)
  }

  return (
    <section id="servicios" className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Servicios
          {offerings.length > 0 && (
            <span className="ml-2 text-sm font-normal text-neutral-500">({offerings.length})</span>
          )}
        </h2>
        {isOwner && !adding && (
          <button
            type="button"
            onClick={startAdding}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
          >
            <PlusIcon className="h-4 w-4" />
            Agregar servicio
          </button>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {isOwner && adding && (
        <div className="mb-4">
          <OfferingForm
            busy={busy}
            onSubmit={handleAdd}
            onCancel={() => {
              setAdding(false)
              setError(null)
            }}
          />
        </div>
      )}

      {offerings.length === 0 ? (
        !adding &&
        (isOwner ? (
          <p className="rounded-xl border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-600 dark:border-neutral-600 dark:text-neutral-400">
            Aún no has agregado servicios. Usa «Agregar servicio» para detallar lo que ofreces y ayudar
            a los clientes a elegirte.
          </p>
        ) : (
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Este profesional aún no ha detallado sus servicios.
          </p>
        ))
      ) : (
        <ul className="space-y-3">
          {offerings.map((offering) => (
            <li key={offering.id}>
              {editingId === offering.id ? (
                <OfferingForm
                  initial={offering}
                  busy={busy}
                  onSubmit={(values) => handleUpdate(offering.id, values)}
                  onCancel={() => {
                    setEditingId(null)
                    setError(null)
                  }}
                />
              ) : (
                <OfferingCard
                  offering={offering}
                  isOwner={isOwner}
                  deleting={deletingId === offering.id}
                  onEdit={() => {
                    setEditingId(offering.id)
                    setAdding(false)
                    setError(null)
                  }}
                  onDelete={() => handleDelete(offering.id)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
