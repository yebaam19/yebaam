'use client'

import { useState, type FormEvent } from 'react'

export interface ReviewFormValues {
  rating: number
  comment: string
}

interface ReviewFormProps {
  onSubmit?: (values: ReviewFormValues) => void
  loading?: boolean
  title?: string
  description?: string
}

export function ReviewForm({
  onSubmit,
  loading = false,
  title = 'Cuéntale a otros cómo te fue',
  description = 'Tu reseña ayuda a que más personas elijan con información real.',
}: ReviewFormProps) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({})

  function validate() {
    const next: typeof errors = {}
    if (!comment.trim()) next.comment = 'Escribe un comentario para publicar tu reseña.'
    else if (comment.trim().length < 10) next.comment = 'Comparte al menos 10 caracteres.'
    if (rating < 1 || rating > 5) next.rating = 'La calificación debe estar entre 1 y 5.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validate()) return
    onSubmit?.({ rating, comment: comment.trim() })
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-sm">
      <div className="px-5 pt-5 pb-1">
        <h3 className="text-lg font-semibold text-neutral-950">{title}</h3>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">Calificación</label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={[
                  'inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-semibold transition',
                  rating === value
                    ? 'border-primary-700 bg-primary-700 text-white'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
                ].join(' ')}
              >
                {value}
              </button>
            ))}
          </div>
          {errors.rating && <p className="text-sm text-red-600">{errors.rating}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700">Comentario</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Cuenta qué pediste, cómo fue la atención o qué recomendarías"
            className={[
              'w-full rounded-2xl border bg-white px-4 py-3 text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:ring-4',
              errors.comment
                ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                : 'border-neutral-200 focus:border-primary-700 focus:ring-primary-700/10',
            ].join(' ')}
          />
          {errors.comment ? (
            <p className="text-sm text-red-600">{errors.comment}</p>
          ) : (
            <p className="text-sm text-neutral-500">Sé específico y útil para quien está por decidir.</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : null}
          Publicar mi reseña
        </button>
      </form>
    </div>
  )
}
