'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { EllipsisHorizontalIcon, PencilSquareIcon, TrashIcon } from '@/components/icons/heroicons-shim';

interface MessageActionsMenuProps {
  /** Only text messages can be edited (no media-only edits). */
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Hover "…" menu on your own messages — Editar (text only) / Eliminar.
 * Uses onMouseDown so the action fires before the button's blur closes the menu.
 */
export function MessageActionsMenu({ canEdit, onEdit, onDelete }: MessageActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('chat.message');

  return (
    <div className="relative self-center opacity-0 transition-opacity group-hover:opacity-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-label={t('actions')}
        className="rounded-full p-1 text-neutral-400 hover:bg-black/5 hover:text-neutral-600 dark:hover:bg-white/10 dark:hover:text-neutral-200"
      >
        <EllipsisHorizontalIcon className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-10 mb-1 w-32 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
          {canEdit && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setOpen(false);
                onEdit();
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              <PencilSquareIcon className="h-4 w-4" />
              {t('edit')}
            </button>
          )}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            <TrashIcon className="h-4 w-4" />
            {t('delete')}
          </button>
        </div>
      )}
    </div>
  );
}
