import { PencilSquareIcon } from '@/components/icons/heroicons-shim';

interface NewMessageButtonProps {
  onClick?: () => void;
}

export default function NewMessageButton({ onClick }: NewMessageButtonProps) {
  return (
    <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
      >
        <PencilSquareIcon className="h-5 w-5" />
        Nuevo mensaje
      </button>
    </div>
  );
}
