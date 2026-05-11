'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { MusicMediaItem } from '../../types/music-media.types';
import { MusicMediaGrid } from './MusicMediaGrid';
import { MusicMediaUploader } from './MusicMediaUploader';

interface Props {
  clubId: string;
  clubName: string;
  canUpload: boolean;
  items: MusicMediaItem[];
}

export function ClubGallerySection({ clubId, clubName, canUpload, items }: Props) {
  const router = useRouter();
  const [showUploader, setShowUploader] = useState(false);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Galería del club
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Fotos y videos compartidos por miembros de {clubName}.
          </p>
        </div>
        {canUpload && (
          <button
            type="button"
            onClick={() => setShowUploader(true)}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            Subir foto / video
          </button>
        )}
      </div>

      <MusicMediaGrid
        items={items}
        emptyText={
          canUpload
            ? 'Aún no hay fotos ni videos. Sé el primero en aportar.'
            : 'Aún no hay fotos ni videos en este club.'
        }
      />

      {showUploader && (
        <MusicMediaUploader
          preClubIds={[clubId]}
          onClose={() => setShowUploader(false)}
          onCreated={() => router.refresh()}
        />
      )}
    </section>
  );
}
