'use client';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
export default function ErrorPage({ reset }: { reset: () => void }) {
  const t = useTranslations('communities.events');
  return <div className="space-y-3 rounded-xl bg-white p-5 dark:bg-neutral-800"><p role="alert">{t('loadError')}</p><Button outline onClick={reset}>{t('retry')}</Button></div>;
}
