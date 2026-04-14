import { useState, useEffect } from 'react';
import { TagIcon, XMarkIcon } from '@/components/icons/heroicons-shim';
import { useActivePromotions } from '@/features/pages/hooks/usePagePromotions';
import type { PagePromotion, PromotionType } from '@/features/pages/interfaces/page-promotion.interface';

interface PromotionSelectorProps {
  pageId: string;
  selectedPromotionId?: string;
  onPromotionSelect: (promotionId: string | undefined) => void;
}

export function PromotionSelector({
  pageId,
  selectedPromotionId,
  onPromotionSelect,
}: PromotionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: promotionsRaw, isLoading } = useActivePromotions(pageId);

  const promotions = promotionsRaw ?? []

  const selectedPromotion = promotions.find(p => p.id === selectedPromotionId);

  const formatDiscount = (promo: PagePromotion) => {
    if (promo.type === 'percentage') {
      return `${promo.value}% de descuento`;
    }
    return `$${promo.value} de descuento`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="border border-gray-300 rounded-lg p-4 text-center text-gray-500">
        <TagIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">No hay promociones activas disponibles</p>
        <p className="text-xs text-gray-400 mt-1">
          Crea promociones en la sección de Promociones
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Promoción (Opcional)
      </label>

      {/* Selected Promotion Display */}
      {selectedPromotion ? (
        <div className="border border-blue-300 bg-blue-50 rounded-lg p-3 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <TagIcon className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">{selectedPromotion.title}</span>
            </div>
            {selectedPromotion.description && (
              <p className="text-sm text-blue-700 mt-1">{selectedPromotion.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-blue-600">
              <span className="font-semibold">{formatDiscount(selectedPromotion)}</span>
              <span>
                {formatDate(selectedPromotion.startDate)} - {formatDate(selectedPromotion.endDate)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onPromotionSelect(undefined)}
            className="text-blue-600 hover:text-blue-800 p-1"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full border border-gray-300 rounded-lg p-3 text-left hover:border-gray-400 transition-colors flex items-center justify-between"
        >
          <span className="text-gray-500">Seleccionar promoción</span>
          <TagIcon className="w-5 h-5 text-gray-400" />
        </button>
      )}

      {/* Promotions Dropdown */}
      {isOpen && !selectedPromotion && (
        <div className="border border-gray-300 rounded-lg shadow-lg bg-white max-h-64 overflow-y-auto">
          {promotions.map((promo) => (
            <button
              key={promo.id}
              type="button"
              onClick={() => {
                onPromotionSelect(promo.id);
                setIsOpen(false);
              }}
              className="w-full p-3 hover:bg-gray-50 border-b last:border-b-0 text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-900">{promo.title}</span>
              </div>
              {promo.description && (
                <p className="text-sm text-gray-600 mt-1">{promo.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="font-semibold text-green-600">{formatDiscount(promo)}</span>
                <span>
                  {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
