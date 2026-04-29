'use client';

import {
  EllipsisHorizontalIcon,
  FlagIcon,
  LockClosedIcon,
} from '@/components/icons/heroicons-shim';
import { useState } from 'react';
import { toast } from 'sonner';

interface ProfileActionsMenuProps {
  // Reserved for when block/report flows wire up to the moderation API.
  userId: string;
}

export default function ProfileActionsMenu(props: ProfileActionsMenuProps) {
  void props;
  const [open, setOpen] = useState(false);

  const handleBlock = () => {
    setOpen(false);
    // TODO: wire to moderation API
    toast.info('La función de bloqueo estará disponible pronto');
  };

  const handleReport = () => {
    setOpen(false);
    // TODO: wire to moderation API
    toast.info('La función de reporte estará disponible pronto');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Más acciones"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={handleBlock}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <LockClosedIcon className="h-4 w-4" />
              Bloquear usuario
            </button>
            <button
              onClick={handleReport}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <FlagIcon className="h-4 w-4" />
              Reportar usuario
            </button>
          </div>
        </>
      )}
    </div>
  );
}
