import type { TextareaHTMLAttributes } from 'react';
export function QuestionTextField({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <label className="block text-sm font-medium">{label}<textarea {...props}
    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm focus:outline-primary-800 dark:border-neutral-600 dark:bg-neutral-900" /></label>;
}
