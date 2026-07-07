'use client'

import { useId, useRef, useState, type FormEvent } from 'react'

export interface ReviewFormValues {
  rating: number
  comment: string
}

interface Props {
  onSubmit?: (values: ReviewFormValues) => void
  loading?: boolean
  title?: string
  description?: string
}

const STAR_LABELS = ['Muy malo', 'Malo', 'Regular', 'Bueno', '¡Excelente!']

function StarIcon({ filled, hovered }: { filled: boolean; hovered: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-7 w-7 sm:h-8 sm:w-8">
      <path
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        className={[
          'transition-colors duration-100',
          filled || hovered
            ? 'fill-amber-400 stroke-amber-400'
            : 'fill-neutral-200 stroke-neutral-200',
        ].join(' ')}
        strokeWidth="0"
      />
    </svg>
  )
}

export function ReviewForm({
  onSubmit,
  loading = false,
  title = 'Deja tu reseña',
  description = 'Ayuda a otros a elegir con información real.',
}: Props) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({})
  const [submitted, setSubmitted] = useState(false)
  const commentId = useId()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function validate() {
    const next: typeof errors = {}
    if (rating < 1) next.rating = 'Selecciona una calificación.'
    if (!comment.trim()) next.comment = 'Escribe un comentario para publicar tu reseña.'
    else if (comment.trim().length < 10) next.comment = 'Comparte al menos 10 caracteres.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return
    onSubmit?.({ rating, comment: comment.trim() })
    setSubmitted(true)
  }

  const displayStar = hovered || rating
  const activeLabel = displayStar > 0 ? (STAR_LABELS[displayStar - 1] ?? '') : ''

  if (submitted) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white p-6 ring-1 ring-neutral-950/5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
            <span className="text-3xl" aria-hidden="true">⭐</span>
          </div>
          <div>
            <p className="text-base font-bold text-neutral-950">¡Gracias por tu reseña!</p>
            <p className="mt-1 text-sm text-neutral-500">Tu opinión ayuda a otros a elegir mejor.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-950/5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="border-b border-neutral-100 px-5 py-4 sm:px-6">
        <h3 className="text-base font-bold text-neutral-950">{title}</h3>
        <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6" noValidate>

        {/* Interactive star rating */}
        <fieldset>
          <legend className="mb-3 block text-sm font-semibold text-neutral-700">
            Calificación
          </legend>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setRating(value)
                  setErrors((e) => ({ ...e, rating: undefined }))
                }}
                onMouseEnter={() => setHovered(value)}
                onMouseLeave={() => setHovered(0)}
                aria-label={`${value} de 5 — ${STAR_LABELS[value - 1] ?? ''}`}
                aria-pressed={rating === value}
                className="touch-manipulation rounded-lg p-0.5 transition-transform duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 active:scale-90"
              >
                <StarIcon filled={value <= rating} hovered={value <= hovered} />
              </button>
            ))}
            {activeLabel && (
              <span
                className="ml-3 text-sm font-semibold text-amber-600 transition-all"
                aria-live="polite"
              >
                {activeLabel}
              </span>
            )}
          </div>
          {errors.rating && (
            <p role="alert" className="mt-2 text-sm font-medium text-red-600">
              {errors.rating}
            </p>
          )}
        </fieldset>

        {/* Comment */}
        <div className="space-y-1.5">
          <label htmlFor={commentId} className="block text-sm font-semibold text-neutral-700">
            Tu experiencia
          </label>
          <textarea
            id={commentId}
            ref={textareaRef}
            value={comment}
            onChange={(e) => {
              setComment(e.target.value)
              if (errors.comment) setErrors((prev) => ({ ...prev, comment: undefined }))
            }}
            rows={4}
            placeholder="¿Qué pediste? ¿Cómo fue la atención? ¿Qué recomendarías?"
            aria-describedby={errors.comment ? `${commentId}-error` : `${commentId}-hint`}
            aria-invalid={!!errors.comment}
            className={[
              'w-full resize-none rounded-xl border bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none',
              'transition-all duration-150 placeholder:text-neutral-400',
              'focus:bg-white focus:ring-4',
              errors.comment
                ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500/10',
            ].join(' ')}
          />
          {errors.comment ? (
            <p id={`${commentId}-error`} role="alert" className="text-sm font-medium text-red-600">
              {errors.comment}
            </p>
          ) : (
            <p id={`${commentId}-hint`} className="flex items-center justify-between text-xs text-neutral-400">
              <span>Sé específico y útil para quien está por decidir.</span>
              <span className={comment.length > 0 ? 'text-neutral-500' : ''}>
                {comment.length}/500
              </span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={[
            'inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            loading
              ? 'cursor-not-allowed bg-primary-400 opacity-70'
              : 'bg-primary-700 hover:bg-primary-800 hover:-translate-y-px hover:shadow-md hover:shadow-primary-700/20',
          ].join(' ')}
        >
          {loading && (
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {loading ? 'Publicando…' : 'Publicar reseña'}
        </button>
      </form>
    </div>
  )
}
