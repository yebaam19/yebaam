'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import type { HeaderImages } from '../../schemas/communityHeaderImage.schema';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import type { Community } from '../../types/community.types';
import type { CommunityShowcase } from '../../types/communityShowcase.types';
import type { LibraryAsset } from '../../types/communityLibrary.types';
import { PlanInteractionProvider, usePlanInteraction } from '../plans/PlanInteractionProvider';
import { useEditorReturnFocus } from '../../hooks/useEditorReturnFocus';
import { CommunityIdentity } from './CommunityIdentity';
import { ShowcasePlayer } from './ShowcasePlayer';

const ShowcaseEditor = dynamic(() => import('./ShowcaseEditor').then((module) => module.ShowcaseEditor), {
  ssr: false,
  loading: () => <p role="status" className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">Cargando editor…</p>,
});

type Props = { community: Community; canManageHeader: boolean; canEdit: boolean; showcase: CommunityShowcase | null; headerImages?: HeaderImages | null };
export function CommunityProfileHeader(props: Props) {
  const pathname = usePathname();
  return <PlanInteractionProvider key={pathname}><Header {...props} isHome={pathname === `/feed/comunidades/${props.community.slug}`} /></PlanInteractionProvider>;
}
function Header({ community, canManageHeader, canEdit, showcase, headerImages, isHome }: Props & { isHome: boolean }) {
  const t = useTranslations('communities.showcase');
  const interaction = usePlanInteraction();
  const opener = useEditorReturnFocus('showcase');
  const editing = interaction.editor === 'showcase';
  const videos = isHome ? showcase?.videos.flatMap((video) => video.asset?.kind === 'video' ? [video.asset as LibraryAsset] : []) ?? [] : [];
  return <div className="rounded-xl border-t-4 border-[var(--community-primary)] bg-white p-4 text-neutral-900 shadow-sm sm:p-5 dark:bg-neutral-800 dark:text-white">
    <div className={videos.length ? 'grid items-start gap-4 sm:gap-6 xl:grid-cols-[0.85fr_1.15fr]' : ''}>
      <div className="min-w-0 space-y-3 sm:space-y-4">
        <CommunityIdentity community={community} headerImages={headerImages} canManageHeader={canManageHeader} stacked={videos.length > 0} />
        {isHome && (showcase?.introduction || (videos.length > 0 && community.description)) && <p className="max-w-prose whitespace-pre-line wrap-anywhere text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
          {showcase?.introduction || community.description}
        </p>}
        {!isHome && showcase && <Link href={`/feed/comunidades/${community.slug}` as Route}
          className="inline-flex min-h-9 items-center text-sm font-medium text-primary-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary-800 dark:text-primary-300">{t('view')}</Link>}
        {isHome && canEdit && <div className="flex flex-wrap items-center gap-2">
          <Button ref={opener} outline disabled={editing} onClick={() => interaction.beginEdit('showcase')}>{t('edit')}</Button>
          {showcase && !showcase.is_published && <span className="text-xs text-secondary-900 dark:text-secondary-300">{t('draft')}</span>}
        </div>}
      </div>
      {videos.length > 0 && <ShowcasePlayer key={`${showcase?.version}`} videos={videos} />}
    </div>
    {isHome && editing && <ShowcaseEditor communityId={community.id} slug={community.slug} initial={showcase} onClose={interaction.endEdit} />}
  </div>;
}
