import React from 'react'
import Button from '../../../components/ui/Button'
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'

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

export default function ReviewForm({
  onSubmit,
  loading = false,
  title = 'Cuéntale a otros cómo te fue',
  description = 'Tu reseña ayuda a que más personas elijan con información real.',
}: ReviewFormProps) {
  const [rating, setRating] = React.useState(5)
  const [comment, setComment] = React.useState('')
  const [errors, setErrors] = React.useState<Partial<Record<keyof ReviewFormValues, string>>>({})

  function validate() {
    const nextErrors: Partial<Record<keyof ReviewFormValues, string>> = {}

    if (!comment.trim()) {
      nextErrors.comment = 'Escribe un comentario para publicar tu reseña.'
    } else if (comment.trim().length < 10) {
      nextErrors.comment = 'Comparte al menos 10 caracteres.'
    }

    if (rating < 1 || rating > 5) {
      nextErrors.rating = 'La calificación debe estar entre 1 y 5.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validate()) return

    onSubmit?.({
      rating,
      comment: comment.trim(),
    })
  }

  return (
    <Card className="border-stone-200 bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Calificación
            </label>

            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => {
                const active = rating === value

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-semibold transition ${
                      active
                        ? 'border-[var(--brand-green-600)] bg-[var(--brand-green-600)] text-white'
                        : 'border-stone-200 bg-white text-slate-700 hover:bg-stone-50'
                    }`}
                  >
                    {value}
                  </button>
                )
              })}
            </div>

            {errors.rating && (
              <p className="text-sm text-red-600">{errors.rating}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Comentario
            </label>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Cuenta qué pediste, cómo fue la atención o qué recomendarías"
              className={`w-full rounded-2xl border bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                errors.comment
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-stone-200 focus:border-[var(--brand-green-600)] focus:ring-[rgba(22,164,76,0.12)]'
              }`}
            />

            {errors.comment ? (
              <p className="text-sm text-red-600">{errors.comment}</p>
            ) : (
              <p className="text-sm text-slate-500">
                Sé específico y útil para quien está por decidir.
              </p>
            )}
          </div>

          <Button type="submit" loading={loading}>
            Publicar mi reseña
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
