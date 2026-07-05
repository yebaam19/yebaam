'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { EllipsisHorizontalIcon, FlagIcon, PencilSquareIcon, TrashIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';

interface MessageActionsMenuProps {
  /** Only text messages can be edited (no media-only edits). */
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Report someone else's message (two-tap inline confirm, no native dialog). */
  onReport?: () => void;
  /** Where the popover grows from the trigger (ChatBubble uses left; full-page chat uses right). */
  align?: 'left' | 'right';
}

/**
 * Hover "…" menu on a message — Editar/Eliminar on your own, Reportar on
 * someone else's. Uses onMouseDown so the action fires before outside-click
 * closes the menu.
 */
export function MessageActionsMenu({
  canEdit = false,
  onEdit,
  onDelete,
  onReport,
  align = 'right',
}: MessageActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmingReport, setConfirmingReport] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('chat.message');

  const toggleMenu = () => {
    setConfirmingReport(false); // never carry a half-confirmed report across opens
    setOpen((v) => !v);
  };

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
        onClick={toggleMenu}
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
            'absolute bottom-full z-50 mb-1 w-40 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {canEdit && onEdit && (
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
          {onDelete && (
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
          )}
          {onReport && (
            <button
              type="button"
              role="menuitem"
              onMouseDown={(e) => {
                e.preventDefault();
                if (!confirmingReport) {
                  setConfirmingReport(true);
                  return;
                }
                setOpen(false);
                onReport();
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700',
                confirmingReport ? 'font-medium text-red-600' : 'text-neutral-700 dark:text-neutral-200',
              )}
            >
              <FlagIcon className="h-4 w-4" />
              {confirmingReport ? t('reportConfirm') : t('report')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
