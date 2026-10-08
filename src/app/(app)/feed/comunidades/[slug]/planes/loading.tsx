import { getTranslations } from 'next-intl/server';

export default async function Loading() {
  const t = await getTranslations('communities.plans');
  return <p role="status" className="rounded-xl bg-white p-6 dark:bg-gray-800">{t('loading')}</p>;
}
