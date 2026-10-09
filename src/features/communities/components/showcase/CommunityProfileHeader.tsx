'use client';
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
import { ShowcaseEditor } from './ShowcaseEditor';

type Props = { community: Community; canManageHeader: boolean; canEdit: boolean; showcase: CommunityShowcase | null; headerImages?: HeaderImages | null };
export function CommunityProfileHeader(props: Props) {
  return <PlanInteractionProvider><Header {...props} /></PlanInteractionProvider>;
}
function Header({ community, canManageHeader, canEdit, showcase, headerImages }: Props) {
  const t = useTranslations('communities.showcase');
  const interaction = usePlanInteraction();
  const opener = useEditorReturnFocus('showcase');
  const editing = interaction.editor === 'showcase';
  const videos = showcase?.videos.flatMap((video) => video.asset?.kind === 'video' ? [video.asset as LibraryAsset] : []) ?? [];
  return <div className="rounded-xl border-t-4 border-[var(--community-primary)] bg-white p-5 text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-white">
    <div className={videos.length ? 'grid items-start gap-6 xl:grid-cols-[0.85fr_1.15fr]' : ''}>
      <div className="min-w-0 space-y-4">
        <CommunityIdentity community={community} headerImages={headerImages} canManageHeader={canManageHeader} stacked={videos.length > 0} />
        {(showcase?.introduction || (videos.length > 0 && community.description)) && <p className="max-w-prose whitespace-pre-line wrap-anywhere text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
          {showcase?.introduction || community.description}
        </p>}
        {canEdit && <div className="flex flex-wrap items-center gap-2">
          <Button ref={opener} outline disabled={editing} onClick={() => interaction.beginEdit('showcase')}>{t('edit')}</Button>
          {showcase && !showcase.is_published && <span className="text-xs text-secondary-900 dark:text-secondary-300">{t('draft')}</span>}
        </div>}
      </div>
      {videos.length > 0 && <ShowcasePlayer key={`${showcase?.version}`} videos={videos} />}
    </div>
    {editing && <ShowcaseEditor communityId={community.id} slug={community.slug} initial={showcase} onClose={interaction.endEdit} />}
  </div>;
}
