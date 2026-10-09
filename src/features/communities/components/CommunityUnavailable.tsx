import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function CommunityUnavailable() {
  const t = await getTranslations('communities.unavailable');
  return (
    <section aria-labelledby="community-unavailable-title" className="mx-auto flex min-h-[60dvh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <span aria-hidden="true" className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-bold text-primary-900">YEBAAM</span>
      <h1 id="community-unavailable-title" className="mt-4 text-xl font-bold text-neutral-900 dark:text-white sm:text-2xl">{t('title')}</h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{t('description')}</p>
      <Link href="/feed/comunidades" className="mt-6 inline-flex min-h-10 items-center rounded-lg bg-primary-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800">
        {t('back')}
      </Link>
    </section>
  );
}
