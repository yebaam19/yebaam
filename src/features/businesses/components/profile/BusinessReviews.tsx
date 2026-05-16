'use client'

/**
 * BusinessReviews Component
 *
 * Sección de reseñas del negocio con ratings y comentarios.
 */

import { ChatBubbleLeftIcon, StarIcon, UserCircleIcon } from '@/components/icons/heroicons-shim'
import { StarIcon as StarSolidIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { BusinessReview } from '../../interfaces/business.interfaces'

interface BusinessReviewsProps {
  /** Lista de reseñas */
  reviews: BusinessReview[]
  /** Rating promedio del negocio */
  averageRating?: number | null
  /** Número total de reseñas */
  totalReviews: number
  /** Número inicial de reseñas a mostrar */
  initialDisplayCount?: number
}

/**
 * Componente para mostrar estrellas de rating
 */
function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>
          {star <= rating ? (
            <StarSolidIcon className={`${sizeClasses} text-yellow-500`} />
          ) : (
            <StarIcon className={`${sizeClasses} text-neutral-300 dark:text-neutral-600`} />
          )}
        </span>
      ))}
    </div>
  )
}

/**
 * Tarjeta de reseña individual
 */
function ReviewCard({ review }: { review: BusinessReview }) {
  const t = useTranslations('businesses.reviews')
  const locale = useLocale()
  const [isExpanded, setIsExpanded] = useState(false)
  const needsExpansion = review.content && review.content.length > 200

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date))
  }

  return (
    <div className="rounded-xl border border-neutral-200 p-4 transition-shadow hover:shadow-md dark:border-neutral-700">
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          {review.user.avatarUrl ? (
            <Image src={review.user.avatarUrl} alt={review.user.username} fill sizes="40px" className="object-cover" />
          ) : (
            <UserCircleIcon className="h-full w-full text-neutral-400" />
          )}
        </div>

        {/* User Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{review.user.username}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <StarRating rating={review.rating} />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(review.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Review Title */}
      {review.title && <h4 className="mt-3 font-medium text-neutral-900 dark:text-neutral-100">{review.title}</h4>}

      {/* Review Content */}
      {review.content && (
        <div className="mt-2">
          <p
            className={`text-sm text-neutral-600 dark:text-neutral-400 ${
              !isExpanded && needsExpansion ? 'line-clamp-3' : ''
            }`}
          >
            {review.content}
          </p>
          {needsExpansion && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {isExpanded ? t('showLess') : t('showMore')}
            </button>
          )}
        </div>
      )}

      {/* Owner Response */}
      {review.response && (
        <div className="mt-3 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-700/50">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('businessResponse')}</p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{review.response}</p>
        </div>
      )}
    </div>
  )
}

/**
 * Barra de distribución de ratings
 */
function RatingDistribution({ reviews }: { reviews: BusinessReview[] }) {
  // Calcular distribución
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100 : 0,
  }))

  return (
    <div className="space-y-2">
      {distribution.map(({ rating, count, percentage }) => (
        <div key={rating} className="flex items-center gap-2 text-sm">
          <span className="w-3 text-neutral-600 dark:text-neutral-400">{rating}</span>
          <StarSolidIcon className="h-4 w-4 text-yellow-500" />
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
            <div
              className="h-full rounded-full bg-yellow-500 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="w-8 text-right text-xs text-neutral-500 dark:text-neutral-400">{count}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Sección de reseñas del negocio
 */
export function BusinessReviews({
  reviews,
  averageRating,
  totalReviews,
  initialDisplayCount = 5,
}: BusinessReviewsProps) {
  const t = useTranslations('businesses.reviews')
  const [showAll, setShowAll] = useState(false)

  // Manejar caso cuando reviews es undefined o null
  const reviewsList = reviews || []
  const displayedReviews = showAll ? reviewsList : reviewsList.slice(0, initialDisplayCount)
  const hasMore = reviewsList.length > initialDisplayCount

  if (reviewsList.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
            <ChatBubbleLeftIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('title')}</h2>
        </div>

        <div className="mt-4 rounded-xl bg-neutral-50 p-8 text-center dark:bg-neutral-700/50">
          <ChatBubbleLeftIcon className="mx-auto h-12 w-12 text-neutral-400" />
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {t('empty')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
          <ChatBubbleLeftIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('title')}</h2>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">({totalReviews})</span>
      </div>

      {/* Summary */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {/* Average Rating */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">
              {averageRating?.toFixed(1) || t('averageNotAvailable')}
            </div>
            <StarRating rating={Math.round(averageRating || 0)} size="md" />
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{t('count', { count: totalReviews })}</p>
          </div>
        </div>

        {/* Rating Distribution */}
        <RatingDistribution reviews={reviews} />
      </div>

      {/* Reviews List */}
      <div className="mt-6 space-y-4 border-t border-neutral-200 pt-6 dark:border-neutral-700">
        {displayedReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {/* Show More Button */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 w-full rounded-xl bg-neutral-100 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
        >
          {t('viewAll', { count: reviews.length })}
        </button>
      )}
    </div>
  )
}
