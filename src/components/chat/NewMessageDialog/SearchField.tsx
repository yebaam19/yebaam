'use client';

import { useTranslations } from 'next-intl';
import { MagnifyingGlassIcon } from '@/components/icons/heroicons-shim';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchField({ value, onChange }: SearchFieldProps) {
  const t = useTranslations('chat.newMessage');

  return (
    <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-full bg-neutral-100 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-neutral-800"
        />
      </div>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{t('composeHint')}</p>
    </div>
  );
}
