'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';

export default function CommunitiesError({ reset }: { reset: () => void }) {
  const t = useTranslations('communities.loadError');
  return (
    <section role="alert" className="mx-auto my-8 max-w-xl rounded-xl border border-primary-100 bg-white p-6 text-center shadow-sm dark:border-primary-900 dark:bg-neutral-800">
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">{t('title')}</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{t('description')}</p>
      <Button className="mt-5" onClick={reset}>{t('retry')}</Button>
    </section>
  );
}
