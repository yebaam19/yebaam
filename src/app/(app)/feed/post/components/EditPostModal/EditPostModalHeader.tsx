'use client';

import { DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@/components/icons/heroicons-shim';

interface EditPostModalHeaderProps {
  title: string;
  onClose: () => void;
  disabled?: boolean;
}

export default function EditPostModalHeader({
  title,
  onClose,
  disabled,
}: EditPostModalHeaderProps) {
  return (
    <div className="relative border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
      <DialogTitle className="text-center text-xl font-bold text-neutral-900 dark:text-white">
        {title}
      </DialogTitle>
      <button
        onClick={onClose}
        disabled={disabled}
        className="absolute right-4 top-4 rounded-full bg-neutral-100 p-2 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <XMarkIcon className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
      </button>
    </div>
  );
}
