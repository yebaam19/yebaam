'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { ABOUT_TEXT_FIELDS, type CommunityAbout } from '../../types/communityAbout.types';

export function AboutReadView({ about, name }: { about: CommunityAbout; name: string }) {
  const t = useTranslations('communities.about');
  const format = useFormatter();
  const details = [
    { key: 'foundedOn', value: about.founded_on ? format.dateTime(new Date(`${about.founded_on}T00:00:00Z`),
      { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '' },
    { key: 'location', value: about.location },
    { key: 'contactEmail', value: about.contact_email },
    { key: 'contactPhone', value: about.contact_phone },
  ].filter((item) => item.value);
  return <div className="min-w-0 space-y-7">
    <div className="max-w-prose">
      <h3 className="text-xl font-semibold wrap-anywhere">{name}</h3>
      {about.description && <div className="prose prose-sm mt-3 wrap-anywhere dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: about.description }} />}
    </div>
    {!!details.length && <dl className="grid min-w-0 gap-x-6 gap-y-4 border-y border-neutral-200 py-4 sm:grid-cols-2 dark:border-neutral-700">
      {details.map((item) => <div key={item.key} className="min-w-0">
        <dt className="text-xs text-neutral-600 dark:text-neutral-400">{t(item.key)}</dt>
        <dd className="mt-1 text-sm wrap-anywhere">{item.value}</dd>
      </div>)}
    </dl>}
    {(about.website || !!about.social_links.length) && <nav aria-label={t('links')} className="flex flex-wrap gap-x-5 gap-y-1">
      {[...(about.website ? [{ label: t('website'), url: about.website }] : []), ...about.social_links].map((link, index) =>
        <a key={`${index}:${link.url}`} href={link.url} target="_blank" rel="noopener noreferrer nofollow"
          aria-label={t('externalLink', { label: link.label })}
          className="inline-flex min-h-11 max-w-full items-center text-sm text-primary-800 underline-offset-4 wrap-anywhere hover:underline focus-visible:outline-2 dark:text-primary-300">
          {link.label}
        </a>)}
    </nav>}
    {ABOUT_TEXT_FIELDS.filter((field) => field !== 'description' && about[field].replace(/<[^>]*>/g, '').trim()).map((field) =>
      <section key={field} className="max-w-prose">
        <h3 className="text-lg font-semibold">{t(`fields.${field}`)}</h3>
        <div className="prose prose-sm mt-2 wrap-anywhere dark:prose-invert" dangerouslySetInnerHTML={{ __html: about[field] }} />
      </section>)}
  </div>;
}
