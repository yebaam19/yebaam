import { useCallback, useEffect, useMemo, useState } from 'react'
import ReviewSectionView from './components/ReviewSection'
import { createReview, getBusinessReviews } from './api'
import { getStoredUser, isAuthenticated } from '../../lib/session'
import { getErrorMessage } from '../../lib/httpError'

type ReviewUser = {
  id: number
  name: string
}

type Review = {
  id: number
  rating: number
  comment?: string | null
  createdAt: string
  user?: ReviewUser
}

type ReviewsResponse = {
  businessId: number
  ratingAverage: number
  reviewsCount: number
  reviews: Review[]
}

type ReviewSectionProps = {
  businessId: number
}

export default function ReviewSection({ businessId }: ReviewSectionProps) {
  const [data, setData] = useState<ReviewsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      setData(await getBusinessReviews<ReviewsResponse>(businessId))
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No pudimos cargar las reseñas'))
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  const reviews = useMemo(
    () =>
      (data?.reviews ?? []).map((review) => ({
        id: review.id,
        authorName: review.user?.name || 'Usuario',
        rating: review.rating,
        comment: review.comment || 'El usuario no dejó comentario.',
        createdAt: review.createdAt,
      })),
    [data]
  )

  const distribution = useMemo(
    () => ({
      stars5: reviews.filter((review) => review.rating === 5).length,
      stars4: reviews.filter((review) => review.rating === 4).length,
      stars3: reviews.filter((review) => review.rating === 3).length,
      stars2: reviews.filter((review) => review.rating === 2).length,
      stars1: reviews.filter((review) => review.rating === 1).length,
    }),
    [reviews]
  )

  const currentUser = getStoredUser()
  const canReview = isAuthenticated()

  if (loading) {
    return <section className="py-8 text-sm text-slate-500">Cargando reseñas...</section>
  }

  if (error) {
    return (
      <section className="py-8 text-sm text-red-600">
        {error}
      </section>
    )
  }

  return (
    <ReviewSectionView
      averageRating={data?.ratingAverage ?? 0}
      totalReviews={data?.reviewsCount ?? 0}
      distribution={distribution}
      reviews={reviews}
      submitLoading={submitLoading}
      canSubmitReview={canReview}
      currentUserName={currentUser?.name}
      onSubmitReview={
        canReview
          ? async ({ rating, comment }) => {
              try {
                setSubmitLoading(true)
                await createReview({ businessId, rating, comment })
                await loadReviews()
              } finally {
                setSubmitLoading(false)
              }
            }
          : undefined
      }
    />
  )
}
