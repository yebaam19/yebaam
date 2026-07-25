'use client';

import { useState } from 'react';

interface Props {
  evidenceUrl: string;
}

export default function EvidenceThumbnail({ evidenceUrl }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => evidenceUrl && setLightbox(evidenceUrl)}
            disabled={!evidenceUrl}
            className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-neutral-100 ring-2 ring-amber-400 dark:bg-neutral-700 dark:ring-amber-500 ${evidenceUrl ? 'cursor-zoom-in hover:opacity-90' : 'cursor-not-allowed opacity-50'}`}
          >
            {evidenceUrl ? (
              <img src={evidenceUrl} alt="Diploma" className="h-full w-full object-cover" decoding="async" loading="lazy" />
            ) : (
              <span className="text-[10px] text-neutral-500">Sin archivo</span>
            )}
          </button>
          <span className="text-center text-[10px] font-medium text-neutral-600 dark:text-neutral-400">
            Diploma / evidencia
          </span>
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Vista ampliada"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
            decoding="async"
            loading="lazy"
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/20"
          >
            Cerrar
          </button>
        </div>
      )}
    </>
  );
}
