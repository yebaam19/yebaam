import Link from 'next/link';
import type { Route } from 'next';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowLeftIcon } from '@/components/icons/heroicons-shim';
import { getHelpById } from '@/features/cities/server/social-help.server';
import { getCityBySlug } from '@/features/cities/server/city.server';

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getHelpById(id);
  return {
    title: item?.title ?? 'Ayuda Social',
    description: item?.description ?? undefined,
  };
}

/**
 * `/cities/[slug]/social-help/[id]` — RSC detail view.
 */
export default async function HelpDetailPage({ params }: Props) {
  const { slug, id } = await params;
  const [city, item] = await Promise.all([
    getCityBySlug(slug),
    getHelpById(id),
  ]);
  if (!city || !item || item.cityId !== city.id) notFound();

  const t = await getTranslations('cities.socialHelp');
  const kindClass =
    item.kind === 'offer'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
      : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';

  return (
    <article className="space-y-5">
      <Link
        href={`/cities/${slug}/social-help` as Route}
        className="inline-flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {t('detail.back')}
      </Link>

      <header className="space-y-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${kindClass}`}
        >
          {t(`kinds.${item.kind}`)}
        </span>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
          {item.title}
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {t('detail.publishedAt', {
            date: new Date(item.createdAt).toLocaleDateString(),
          })}
          {item.status === 'closed' && (
            <>
              {' · '}
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                {t('detail.closed')}
              </span>
            </>
          )}
        </p>
      </header>

      {item.imageUrl && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full object-cover"
            decoding="async"
            loading="lazy"
          />
        </div>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white px-5 py-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <p className="whitespace-pre-line text-sm text-neutral-800 dark:text-neutral-200">
          {item.description?.trim() ? item.description : t('detail.noDescription')}
        </p>
      </section>
    </article>
  );
}
