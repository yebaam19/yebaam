'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';

export default function LibraryError({ reset }: { reset: () => void }) {
  const t = useTranslations('communities.library');
  return <div role="alert" className="space-y-4 rounded-xl bg-white p-5 text-neutral-900 dark:bg-neutral-800 dark:text-white">
    <p>{t('unavailable')}</p><Button outline onClick={reset}>{t('tryAgain')}</Button>
  </div>;
}
