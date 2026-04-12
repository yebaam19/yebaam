import { ProductStock } from '@/interfaces/page-product.interface';

interface ProductStockBadgeProps {
  stock: ProductStock;
  size?: 'sm' | 'md';
}

export function ProductStockBadge({ stock, size = 'md' }: ProductStockBadgeProps) {
  if (!stock.trackInventory) {
    return (
      <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-green-600 font-medium`}>
        En stock
      </span>
    );
  }

  if (!stock.isInStock) {
    return (
      <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-red-600 font-medium`}>
        Agotado
      </span>
    );
  }

  if (stock.isLowStock) {
    return (
      <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-orange-600 font-medium`}>
        ¡Últimas unidades! ({stock.quantity} disponibles)
      </span>
    );
  }

  return (
    <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-green-600 font-medium`}>
      En stock ({stock.quantity} disponibles)
    </span>
  );
}
