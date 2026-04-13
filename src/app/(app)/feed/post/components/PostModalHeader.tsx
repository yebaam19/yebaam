import { XMarkIcon } from '@/components/icons/heroicons-shim';

interface PostModalHeaderProps {
  onClose: () => void;
  isDisabled?: boolean;
}

export default function PostModalHeader({ onClose, isDisabled }: PostModalHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
      <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
        Crear publicación
      </h2>
      <button
        onClick={onClose}
        disabled={isDisabled}
        className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
      >
        <XMarkIcon className="h-6 w-6 text-neutral-500" />
      </button>
    </div>
  );
}
