'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { StarIcon } from '@/components/icons/heroicons-shim'
import { useAuth } from '@/features/auth'
import { createServiceReviewAction } from '../../../actions/services.actions'
import type { ProfessionalServiceReview } from '../../../interfaces/professional-service.interfaces'

interface ReviewFormProps {
  serviceId: string
  /** Dueño del servicio — no puede reseñarse a sí mismo. */
  ownerId: string
  reviews: ProfessionalServiceReview[]
}

/**
 * Formulario para calificar (1-5 estrellas) y comentar un servicio profesional.
 * Se oculta para el dueño; los visitantes sin sesión ven el aviso de login.
 * Si el visitante ya reseñó, el envío actualiza su reseña (upsert en el server).
 */
export function ReviewForm({ serviceId, ownerId, reviews }: ReviewFormProps) {
  const { user, isAuthenticated, isInitialized } = useAuth()
  const existing = user ? reviews.find((r) => r.userId === user.id) : undefined

  if (!isInitialized) return null
  if (user?.id === ownerId) return null

  if (!isAuthenticated) {
    return (
      <div className="mb-6 rounded-xl border border-dashed border-neutral-300 p-4 text-center text-sm text-neutral-600 dark:border-neutral-600 dark:text-neutral-400">
        <Link href="/login" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
          Inicia sesión
        </Link>{' '}
        para reseñar este servicio.
      </div>
    )
  }

  // Keyed remount: cuando la reseña existente aparece (tras hidratar auth),
  // el formulario se reinicializa con sus valores sin setState en un efecto.
  return <ReviewFormInner key={existing?.id ?? 'new'} serviceId={serviceId} existing={existing} />
}

function ReviewFormInner({
  serviceId,
  existing,
}: {
  serviceId: string
  existing: ProfessionalServiceReview | undefined
}) {
  const router = useRouter()
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState(existing?.comment ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating < 1) {
      setError('Selecciona una calificación de 1 a 5 estrellas.')
      return
    }
    setBusy(true)
    setError(null)
    setSuccess(false)
    const result = await createServiceReviewAction(serviceId, {
      rating,
      comment: comment.trim() || undefined,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSuccess(true)
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-700"
    >
      <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
        {existing ? 'Actualiza tu reseña' : 'Escribe una reseña'}
      </h3>

      {/* Selector de estrellas */}
      <div className="mt-3 flex items-center gap-1" role="radiogroup" aria-label="Calificación">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
            className="p-0.5"
          >
            <StarIcon
              className={`h-7 w-7 transition-colors ${
                star <= (hovered || rating) ? 'text-amber-400' : 'text-neutral-300 dark:text-neutral-600'
              }`}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Cuenta tu experiencia con este servicio (opcional)"
        className="mt-3 w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
      />

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {success && <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">¡Gracias por tu reseña!</p>}

      <div className="mt-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-60"
        >
          {busy ? 'Enviando…' : existing ? 'Actualizar reseña' : 'Publicar reseña'}
        </button>
      </div>
    </form>
  )
}
