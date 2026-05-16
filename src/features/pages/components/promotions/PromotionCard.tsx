import { FC, useState } from 'react';
import {
  TicketIcon,
  CalendarIcon,
  TagIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhotoIcon,
} from '@/components/icons/heroicons-shim';
import { PagePromotion, PromotionType } from '../../interfaces/page-promotion.interface';
import { format } from 'date-fns';
import { useDateFnsLocale } from '@/lib/utils/date-fns-locale';
import Image from 'next/image';

interface PromotionCardProps {
  promotion: PagePromotion;
  onEdit?: (promotion: PagePromotion) => void;
  onDelete?: (promotionId: string) => void;
  canManage?: boolean;
}

export const PromotionCard: FC<PromotionCardProps> = ({
  promotion,
  onEdit,
  onDelete,
  canManage,
}) => {
  const [imageError, setImageError] = useState(false);
  const dateLocale = useDateFnsLocale();

  const getPromotionText = () => {
    switch (promotion.type) {
      case PromotionType.PERCENTAGE:
        return `${promotion.value}% OFF`;
      case PromotionType.FIXED:
        return `$${promotion.value} OFF`;
      case PromotionType.BOGO:
        return `${promotion.value}x${promotion.value} `;
      case PromotionType.FREE_SHIPPING:
        return 'ENVÍO GRATIS';
      case PromotionType.BUNDLE:
        return 'PAQUETE ESPECIAL';
      default:
        return 'PROMOCIÓN';
    }
  };

  const getStatusColor = () => {
    if (promotion.isExpired) return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    if (promotion.isUpcoming) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700';
    return 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-300 dark:border-purple-700';
  };

  const getStatusBadge = () => {
    if (promotion.isExpired) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-full">
          <XCircleIcon className="w-4 h-4" />
          Expirada
        </span>
      );
    }
    if (promotion.isUpcoming) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded-full">
          <ClockIcon className="w-4 h-4" />
          Próximamente
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-full">
        <CheckCircleIcon className="w-4 h-4" />
        Activa
      </span>
    );
  };

  return (
    <div className={`relative rounded-lg border-2 ${getStatusColor()} overflow-hidden transition-all hover:shadow-lg`}>
      {/* Ticket perforations effect */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-900 rounded-full -ml-3 border-2 border-gray-200 dark:border-gray-700" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-900 rounded-full -mr-3 border-2 border-gray-200 dark:border-gray-700" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <TicketIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {promotion.title}
              </h3>
            </div>
            {getStatusBadge()}
          </div>

          {canManage && (
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => onEdit?.(promotion)}
                className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete?.(promotion.id)}
                className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>

        {/* Discount/Offer Badge */}
        <div className="mb-4">
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg shadow-lg">
            <p className="text-3xl font-black">
              {getPromotionText()}
            </p>
          </div>
        </div>

        {/* Promotion Image */}
        {promotion.imageUrl && !imageError && (
          <div className="mb-4 rounded-lg overflow-hidden border-2 border-dashed border-purple-300 dark:border-purple-700">
            <div className="relative w-full h-48">
              <Image
                src={promotion.imageUrl}
                alt={promotion.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          {promotion.description}
        </p>

        {/* Promotion Code */}
        {promotion.code && (
          <div className="mb-4 p-3 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Código promocional:
                </p>
                <p className="text-xl font-mono font-bold text-purple-600 dark:text-purple-400">
                  {promotion.code}
                </p>
              </div>
              <TagIcon className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        )}

        {/* Date Range */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            <span>
              {format(new Date(promotion.startDate), 'dd MMM', { locale: dateLocale })} - {' '}
              {format(new Date(promotion.endDate), 'dd MMM yyyy', { locale: dateLocale })}
            </span>
          </div>
          {promotion.daysRemaining && promotion.daysRemaining > 0 && (
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold">
              <ClockIcon className="w-5 h-5" />
              <span>{promotion.daysRemaining} días restantes</span>
            </div>
          )}
        </div>

        {/* Usage Stats */}
        {promotion.usageLimit && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>Usos</span>
              <span>
                {promotion.usageCount} / {promotion.usageLimit}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                style={{
                  width: `${(promotion.usageCount / promotion.usageLimit) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Terms */}
        {promotion.terms && (
          <details className="text-xs text-gray-500 dark:text-gray-400">
            <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
              Términos y condiciones
            </summary>
            <p className="mt-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
              {promotion.terms}
            </p>
          </details>
        )}
      </div>

      {/* Featured Badge */}
      {promotion.isFeatured && (
        <div className="absolute top-4 right-4">
          <div className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full shadow-lg">
            ⭐ DESTACADA
          </div>
        </div>
      )}
    </div>
  );
};
