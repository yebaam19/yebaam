'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { EllipsisHorizontalIcon, PencilSquareIcon, TrashIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';

interface MessageActionsMenuProps {
  /** Only text messages can be edited (no media-only edits). */
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  /** Where the popover grows from the trigger (ChatBubble uses left; full-page chat uses right). */
  align?: 'left' | 'right';
}

/**
 * Hover "…" menu on your own messages — Editar (text only) / Eliminar.
 * Uses onMouseDown so the action fires before outside-click closes the menu.
 */
export function MessageActionsMenu({
  canEdit,
  onEdit,
  onDelete,
  align = 'right',
}: MessageActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('chat.message');

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative self-center opacity-0 transition-opacity group-hover:opacity-100"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('actions')}
        className="rounded-full p-1 text-neutral-400 hover:bg-black/5 hover:text-neutral-600 dark:hover:bg-white/10 dark:hover:text-neutral-200"
      >
        <EllipsisHorizontalIcon className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute bottom-full z-50 mb-1 w-32 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {canEdit && (
            <button
              type="button"
              role="menuitem"
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
            role="menuitem"
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
