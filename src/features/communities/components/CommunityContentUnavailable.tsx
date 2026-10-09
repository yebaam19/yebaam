import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

type Kind = 'event' | 'question' | 'article' | 'plan';

/** Identical response for missing and RLS-hidden content. */
export async function CommunityContentUnavailable({ kind }: { kind: Kind }) {
  const t = await getTranslations('communities');
  const copy = kind === 'event'
    ? { title: t('events.unavailableTitle'), description: t('events.unavailableDescription') }
    : kind === 'question'
      ? { title: t('questions.unavailableTitle'), description: t('questions.unavailableDescription') }
      : kind === 'article'
        ? { title: t('unavailable.articleTitle'), description: t('unavailable.articleDescription') }
        : { title: t('unavailable.planTitle'), description: t('unavailable.planDescription') };

  return <section className="mx-auto my-8 max-w-xl rounded-xl bg-white p-6 text-neutral-900 sm:p-8 dark:bg-neutral-800 dark:text-white">
    <meta name="robots" content="noindex" />
    <h2 className="text-xl font-semibold">{copy.title}</h2>
    <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{copy.description}</p>
    <Link href="/feed/comunidades" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary-800 px-4 text-sm font-semibold text-white hover:bg-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 dark:focus-visible:outline-primary-300">
      {t('unavailable.back')}
    </Link>
  </section>;
}
