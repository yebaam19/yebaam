'use client';

import { FC, useState } from 'react';
import Image from 'next/image';
import { resolveImageRef } from '@/lib/media/urls';
import type { Page } from '../../../types/page.types';
import { PageImageEditOverlay } from './PageImageEditOverlay';

interface PageProfilePhotoProps {
  page: Page;
  isOwnerOrAdmin?: boolean;
}

/**
 * "FOTO DE PERFIL" del wireframe (pág. 13): una tarjeta propia bajo la portada,
 * NO un avatar superpuesto sobre ella. El nombre y los datos van en la tarjeta
 * "Detalles" de debajo (§3), no aquí.
 */
export const PageProfilePhoto: FC<PageProfilePhotoProps> = ({ page, isOwnerOrAdmin = false }) => {
  const [profileSrc, setProfileSrc] = useState(() => resolveImageRef(page.profileImageUrl, 'avatar'));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700 group">
        {profileSrc ? (
          <Image
            src={profileSrc}
            alt={page.name}
            fill
            sizes="(min-width: 1280px) 240px, (min-width: 1024px) 200px, 100vw"
            className="object-cover"
            priority
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-gray-400 dark:text-gray-500">
            {page.name.charAt(0).toUpperCase()}
          </div>
        )}

        {isOwnerOrAdmin && (
          <PageImageEditOverlay
            pageId={page.id}
            type="profile"
            onUploaded={setProfileSrc}
          />
        )}
      </div>
    </div>
  );
};
