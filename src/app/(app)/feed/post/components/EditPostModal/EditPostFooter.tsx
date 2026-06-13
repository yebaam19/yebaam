'use client';

interface EditPostFooterProps {
  label: string;
  disabled?: boolean;
}

export default function EditPostFooter({ label, disabled }: EditPostFooterProps) {
  return (
    <div className="border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
      <button
        type="submit"
        disabled={disabled}
        className="w-full rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-300 dark:disabled:bg-neutral-700"
      >
        {label}
      </button>
    </div>
  );
}
