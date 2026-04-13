import { FC } from 'react';
import Link from 'next/link';
import { Cog6ToothIcon } from '@/components/icons/heroicons-shim';
import { PublicProductsCatalog } from '@/components/products/PublicProductsCatalog';
import { OwnerProductsList } from '@/components/products/OwnerProductsList';

interface PageDetailProductsProps {
  pageId: string;
  pageSlug: string;
  isOwner: boolean;
}

export const PageDetailProducts: FC<PageDetailProductsProps> = ({
  pageId,
  pageSlug,
  isOwner,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isOwner ? 'Gestión de Productos' : 'Productos'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isOwner
              ? 'Administra los productos y servicios de tu página'
              : 'Explora los productos y servicios disponibles'}
          </p>
        </div>

        {isOwner && (
          <Link
            href={`/feed/paginas/${pageSlug}/settings?section=products`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm hover:shadow-md"
          >
            <Cog6ToothIcon className="w-5 h-5" />
            Panel Completo
          </Link>
        )}
      </div>

      {isOwner ? (
        <OwnerProductsList pageId={pageId} />
      ) : (
        <PublicProductsCatalog pageId={pageId} />
      )}
    </div>
  );
};
