import { PageProduct } from '@/interfaces/page-product.interface';

interface ProductPriceDisplayProps {
  product: PageProduct;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export function ProductPriceDisplay({ 
  product, 
  size = 'md',
  showBadge = true 
}: ProductPriceDisplayProps) {
  const hasActivePromotion = product.promotion?.isActive && product.finalPrice;
  
  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  const smallTextSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {hasActivePromotion && product.finalPrice ? (
        <>
          <span className={`font-bold text-red-600 ${textSizes[size]}`}>
            {formatCurrency(product.finalPrice.amount, product.finalPrice.currency)}
          </span>
          <span className={`line-through text-gray-400 ${smallTextSizes[size]}`}>
            {formatCurrency(product.price.amount, product.price.currency)}
          </span>
          {showBadge && product.promotion && (
            <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
              {product.promotion.discountType === 'percentage' 
                ? `-${product.promotion.discountValue}%`
                : `-${formatCurrency(product.promotion.discountValue, product.price.currency)}`
              }
            </span>
          )}
        </>
      ) : product.price.hasDiscount && product.price.compareAtAmount ? (
        <>
          <span className={`font-bold ${textSizes[size]}`}>
            {formatCurrency(product.price.amount, product.price.currency)}
          </span>
          <span className={`line-through text-gray-400 ${smallTextSizes[size]}`}>
            {formatCurrency(product.price.compareAtAmount, product.price.currency)}
          </span>
          {showBadge && product.price.discountPercentage && (
            <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded">
              -{product.price.discountPercentage}%
            </span>
          )}
        </>
      ) : (
        <span className={`font-bold ${textSizes[size]}`}>
          {formatCurrency(product.price.amount, product.price.currency)}
        </span>
      )}
    </div>
  );
}
