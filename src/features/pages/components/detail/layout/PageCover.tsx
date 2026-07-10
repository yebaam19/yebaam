'use client';

import { FC, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import type { Page } from '../../../types/page.types';
import { resolveImageRef } from '@/lib/media/urls';
import { PageCoverActions } from './PageCoverActions';
import { PageImageEditOverlay } from './PageImageEditOverlay';

/** Abre un WebSocket y arrastra socket.io: se monta sólo al abrirlo. */
const PageMessengerPanel = dynamic(() => import('../../messages/PageMessengerPanel'), {
  ssr: false,
});

interface PageCoverProps {
  page: Page;
  isOwnerOrAdmin: boolean;
  unreadCount: number;
}

/**
 * "PORTADA" del wireframe (pág. 13): sólo la imagen de portada y los botones de
 * §1.3 apilados arriba a la derecha. A diferencia del header histórico, aquí no
 * van ni el avatar ni el nombre: el wireframe los baja a la columna de identidad.
 */
export const PageCover: FC<PageCoverProps> = ({ page, isOwnerOrAdmin, unreadCount }) => {
  const t = useTranslations('pages.detail.header');
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);
  const [coverSrc, setCoverSrc] = useState(() => resolveImageRef(page.coverImageUrl, 'hero'));

  return (
    <div className="relative h-56 sm:h-72 lg:h-80 w-full overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
      {coverSrc ? (
        <Image
          src={coverSrc}
          alt={t('coverAlt', { name: page.name })}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      ) : (
        <div className="w-full h-full bg-linear-to-r from-blue-500 to-purple-600" />
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />

      {isOwnerOrAdmin && (
        <PageImageEditOverlay
          pageId={page.id}
          type="cover"
          onUploaded={setCoverSrc}
        />
      )}

      <PageCoverActions
        page={page}
        isOwnerOrAdmin={isOwnerOrAdmin}
        unreadCount={unreadCount}
        onOpenMessenger={() => setIsMessengerOpen(true)}
      />

      {isMessengerOpen && (
        <PageMessengerPanel
          pageId={page.id}
          isOpen
          onClose={() => setIsMessengerOpen(false)}
        />
      )}
    </div>
  );
};
