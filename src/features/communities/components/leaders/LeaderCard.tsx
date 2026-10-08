'use client';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { UserIcon } from '@/components/icons/heroicons-shim';
import { imageUrl } from '@/lib/media/urls';
import type { LeaderSummary } from '../../types/communityLeader.types';
import { usePlanInteraction } from '../plans/PlanInteractionProvider';

export function LeaderCard({ leader, slug, canEdit }: { leader: LeaderSummary; slug: string; canEdit: boolean }) {
  const t = useTranslations('communities.leaders');
  const interaction = usePlanInteraction();
  const locked = interaction.busy || !!interaction.editor;
  const image = leader.portrait?.asset;
  return <Link href={`/feed/comunidades/${encodeURIComponent(slug)}/lideres/${leader.id}` as Route}
    aria-disabled={locked || undefined} onClick={(event) => { if (locked) event.preventDefault(); }}
    className="group min-w-0 overflow-hidden rounded-xl border border-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 dark:focus-visible:outline-primary-300 dark:border-neutral-700">
    <div className="relative aspect-[4/3] bg-neutral-100 dark:bg-neutral-900">
      {image ? <Image src={imageUrl(image.media_id)} alt="" fill unoptimized className="object-cover" sizes="(max-width: 640px) 100vw, 300px" />
        : <div className="flex h-full items-center justify-center"><UserIcon aria-hidden="true" className="size-16 text-neutral-400 dark:text-neutral-500" /></div>}
    </div>
    <div className="space-y-1 p-4"><h3 className="wrap-anywhere text-base font-semibold group-hover:text-primary-800 dark:group-hover:text-primary-300">{leader.full_name}</h3>
      {leader.responsibility && <p className="wrap-anywhere text-sm text-neutral-600 dark:text-neutral-300">{leader.responsibility}</p>}
      {canEdit && !leader.is_published && <p className="text-xs text-secondary-900 dark:text-secondary-300">{t('draft')}</p>}
      <span className="inline-flex min-h-11 items-center text-sm text-primary-800 dark:text-primary-300">{t('viewProfile')}</span>
    </div>
  </Link>;
}
