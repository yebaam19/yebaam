'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createReview } from '../../../actions/review.actions'

const schema = z.object({
  rating:  z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
})

interface Props { businessId: string }

export function BusinessWriteReview({ businessId }: Props) {
  const [submitted, setSubmitted] = useState(false)
  type FormValues = z.infer<typeof schema>
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rating: 5 },
  })

  const ratingVal = watch('rating')

  async function onSubmit(values: FormValues) {
    const fd = new FormData()
    fd.append('business_id', businessId)
    fd.append('rating', String(values.rating))
    if (values.comment) fd.append('comment', values.comment)
    try {
      await createReview(fd)
      toast.success('¡Reseña publicada! Gracias por tu opinión.')
      setSubmitted(true)
    } catch {
      toast.error('No se pudo publicar. Intenta de nuevo.')
    }
  }

  if (submitted) {
    return (
      <div className="rounded-[1.5rem] border border-primary-200 bg-primary-50 p-5 text-center shadow-sm">
        <p className="text-2xl">⭐</p>
        <p className="mt-2 font-semibold text-neutral-900">¡Reseña publicada!</p>
        <p className="mt-1 text-sm text-neutral-500">Tu opinión ayuda a otros usuarios a descubrir este negocio.</p>
      </div>
    )
  }

  return (
    <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">Dejar reseña</p>
      <h3 className="mt-2 text-lg font-semibold text-neutral-900">¿Cómo fue tu experiencia?</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">Calificación *</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <label key={s} className="cursor-pointer text-2xl leading-none">
                <input {...register('rating', { valueAsNumber: true })} type="radio" value={s} className="sr-only" />
                <span className={s <= Number(ratingVal) ? 'text-amber-400' : 'text-neutral-300'}>★</span>
              </label>
            ))}
          </div>
          {errors.rating && <p className="mt-1 text-xs text-red-500">{errors.rating.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-700">Comentario (opcional)</label>
          <textarea {...register('comment')} rows={3}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-700 focus:outline-none focus:ring-1 focus:ring-primary-700"
            placeholder="Cuéntanos qué te pareció..." />
          {errors.comment && <p className="mt-1 text-xs text-red-500">{errors.comment.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting}
          className="w-full rounded-2xl bg-primary-700 py-3 text-sm font-semibold text-white transition hover:bg-primary-800 disabled:opacity-50">
          {isSubmitting ? 'Publicando…' : 'Publicar reseña'}
        </button>
      </form>
    </div>
  )
}
