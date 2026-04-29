import { FC, useState } from 'react';
import Image from 'next/image';
import { StarIcon, HandThumbUpIcon } from '@/components/icons/heroicons-shim';
import { HandThumbUpIcon as HandThumbUpOutline, CheckBadgeIcon } from '@/components/icons/heroicons-shim';
import { PageReview } from '../../interfaces/page-review.interface';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReviewCardProps {
  review: PageReview;
  onToggleHelpful: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
  onEdit?: (reviewId: string) => void;
  isOwner?: boolean;
  canEdit?: boolean;
}

export const ReviewCard: FC<ReviewCardProps> = ({
  review,
  onToggleHelpful,
  onDelete,
  onEdit,
  isOwner,
  canEdit,
}) => {
  const [showFullComment, setShowFullComment] = useState(false);
  const shouldTruncate = review.comment.length > 300;

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: es,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {/* Avatar */}
          <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600">
            {review.user.profilePicture ? (
              <Image
                src={review.user.profilePicture}
                alt={review.user.fullName}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-semibold text-lg">
                {review.user.fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                {review.user.fullName}
              </h4>
              {review.user.isVerified && (
                <CheckBadgeIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              @{review.user.username}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {renderStars(review.rating)}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(review.createdAt)}
                {review.isEdited && ' (editado)'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit?.(review.id)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Editar
            </button>
            <button
              onClick={() => onDelete?.(review.id)}
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Comment */}
      <div className="mb-4">
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
          {shouldTruncate && !showFullComment
            ? review.comment.slice(0, 300) + '...'
            : review.comment}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setShowFullComment(!showFullComment)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1"
          >
            {showFullComment ? 'Ver menos' : 'Ver más'}
          </button>
        )}
      </div>

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {review.photos.map((photo, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700"
            >
              <Image
                src={photo}
                alt={`Review photo ${index + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Owner Response */}
      {review.ownerResponse && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">P</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                Respuesta del propietario
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {review.ownerRespondedAt && formatDate(review.ownerRespondedAt)}
              </p>
            </div>
          </div>
          <p className="text-sm text-blue-900 dark:text-blue-200">
            {review.ownerResponse}
          </p>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onToggleHelpful(review.id)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {review.isHelpfulByCurrentUser ? (
            <HandThumbUpIcon className="w-5 h-5 text-blue-600" />
          ) : (
            <HandThumbUpOutline className="w-5 h-5" />
          )}
          <span>
            Útil {review.helpfulCount > 0 && `(${review.helpfulCount})`}
          </span>
        </button>
      </div>
    </div>
  );
};
