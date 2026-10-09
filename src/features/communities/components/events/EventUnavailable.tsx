import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

/** Use the same response for missing and RLS-hidden events. */
export async function EventUnavailable() {
  const t = await getTranslations('communities.events');
  return <section className="mx-auto my-8 max-w-xl rounded-xl bg-white p-6 text-neutral-900 sm:p-8 dark:bg-neutral-800 dark:text-white">
    <meta name="robots" content="noindex" />
    <h2 className="text-xl font-semibold">{t('unavailableTitle')}</h2>
    <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{t('unavailableDescription')}</p>
    <Link href="/feed/comunidades" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary-800 px-4 text-sm font-semibold text-white hover:bg-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 dark:focus-visible:outline-primary-300">
      {t('browseCommunities')}
    </Link>
  </section>;
}
