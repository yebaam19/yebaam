'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCommunity } from '@/features/communities/actions/communities.actions';
import {
  EllipsisHorizontalIcon,
  TrashIcon,
} from '@/components/icons/heroicons-shim';

interface CommunityOwnerMenuProps {
  communityId: string;
  communityName: string;
}

export function CommunityOwnerMenu({ communityId, communityName }: CommunityOwnerMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteCommunity(communityId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push('/feed/comunidades');
      router.refresh();
    });
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Acciones de la comunidad"
        className="rounded-full bg-white/90 p-2 text-gray-700 shadow-md hover:bg-white"
      >
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirmOpen(true);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <TrashIcon className="h-4 w-4" />
            Eliminar comunidad
          </button>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Eliminar comunidad
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              ¿Eliminar “{communityName}”? Se borrarán todos sus posts, miembros y artículos. Esta
              acción no se puede deshacer.
            </p>
            {error && (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setError(null);
                }}
                disabled={isPending}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
