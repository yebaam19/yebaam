import type { FormEvent } from 'react';
import { PaperAirplaneIcon } from '@/components/icons/heroicons-shim';

interface SendButtonProps {
  disabled: boolean;
  onSend: (e: FormEvent) => void;
}

/** Send action button. */
export function SendButton({ disabled, onSend }: SendButtonProps) {
  return (
    <button
      onClick={onSend}
      disabled={disabled}
      className="rounded-full p-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <PaperAirplaneIcon className="h-5 w-5 text-primary-600" />
    </button>
  );
}
