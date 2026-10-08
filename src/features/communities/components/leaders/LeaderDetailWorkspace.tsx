'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import { StreamVideo } from '@/components/media/StreamVideo';
import { imageUrl } from '@/lib/media/urls';
import type { CommunityLeader, LeaderCategory, LeaderContacts, LeaderMedia } from '../../types/communityLeader.types';
import type { PlanPage } from '../../types/communityPlan.types';
import { deleteCommunityLeader } from '../../actions/leaders/content.actions';
import { loadLeaderCategories } from '../../actions/leaders/queries.actions';
import { usePlanPage } from '../../hooks/usePlanPage';
import { useEditorReturnFocus } from '../../hooks/useEditorReturnFocus';
import { PlanInteractionProvider, usePlanInteraction } from '../plans/PlanInteractionProvider';
import { PlanFeedback } from '../plans/PlanFeedback';
import { LeaderForm } from './LeaderForm';
import { LeaderDeleteControl } from './LeaderDeleteControl';
import { LeaderContactsPanel } from './LeaderContactsPanel';
import { LeaderMediaControls } from './LeaderMediaControls';

type Props = { slug: string; leader: CommunityLeader; categories: PlanPage<LeaderCategory>; category: LeaderCategory | null;
  contacts: LeaderContacts | null; media: LeaderMedia[]; canEdit: boolean };
export function LeaderDetailWorkspace(props: Props) { return <PlanInteractionProvider><Detail {...props} /></PlanInteractionProvider>; }
function Detail({ slug, leader, categories: initial, category, contacts, media, canEdit }: Props) {
  const t = useTranslations('communities.leaders');
  const router = useRouter();
  const interaction = usePlanInteraction();
  const opener = useEditorReturnFocus('edit-leader');
  const categories = usePlanPage(initial, (cursor) => loadLeaderCategories({ communityId: leader.community_id, sectionId: leader.section_id, cursor }));
  const options = category && !categories.items.some((item) => item.id === category.id) ? [...categories.items, category] : categories.items;
  const cover = media.find((item) => item.slot === 'cover')?.asset;
  const portrait = media.find((item) => item.slot === 'portrait')?.asset;
  const video = media.find((item) => item.slot === 'video')?.asset;
  const href = `/feed/comunidades/${encodeURIComponent(slug)}/lideres` as Route;
  const locked = interaction.busy || !!interaction.editor;
  return <article className="min-w-0 overflow-hidden rounded-xl bg-white text-neutral-900 dark:bg-neutral-800 dark:text-white">
    {cover && <div className="relative aspect-[3/1]"><Image src={imageUrl(cover.media_id)} alt={cover.title} fill unoptimized sizes="100vw" className="object-cover" /></div>}
    <div className="p-4 sm:p-6">
      <Link href={href} aria-disabled={locked || undefined} onClick={(event) => { if (locked) event.preventDefault(); }} className="inline-flex min-h-11 items-center text-sm text-primary-800 hover:underline focus-visible:outline-2 dark:text-primary-300">{t('back')}</Link>
      <div className="mt-3 flex flex-wrap items-start gap-4">
        {portrait && <Image src={imageUrl(portrait.media_id)} alt="" width={88} height={88} unoptimized className="size-22 rounded-xl object-cover" />}
        <div className="min-w-0 flex-1 basis-40"><h2 className="wrap-anywhere text-xl font-semibold">{leader.full_name}</h2>
          {leader.responsibility && <p className="mt-1 wrap-anywhere text-sm text-neutral-600 dark:text-neutral-300">{leader.responsibility}</p>}
          {category && <p className="mt-2 wrap-anywhere text-sm text-neutral-600 dark:text-neutral-300">{category.title}</p>}
          {canEdit && !leader.is_published && <p className="mt-2 text-sm text-secondary-900 dark:text-secondary-300">{t('draft')}</p>}
        </div>
        {canEdit && <div className="flex flex-wrap gap-2"><Button ref={opener} color="brand" disabled={locked} onClick={() => interaction.beginEdit('edit-leader')}>{t('edit')}</Button>
          <LeaderDeleteControl id={leader.id} name={leader.full_name} remove={() => deleteCommunityLeader({ communityId: leader.community_id, id: leader.id, expectedVersion: leader.version, confirmed: true })} onDeleted={() => router.push(href)} /></div>}
      </div>
      {interaction.editor === 'edit-leader' ? <>
        {categories.nextCursor && <Button outline className="mt-4" disabled={interaction.busy || categories.pending} onClick={categories.loadMore}>{t(categories.pending ? 'loading' : 'moreCategories')}</Button>}
        <PlanFeedback error={categories.error} />
        <LeaderForm communityId={leader.community_id} sectionId={leader.section_id} leader={leader} categories={options} editorId="edit-leader" onClose={interaction.endEdit} />
      </> : <div className="mt-7 space-y-7">{(['biography', 'trajectory'] as const).filter((field) => leader[field].replace(/<[^>]*>/g, '').trim()).map((field) => <section key={field} className="max-w-prose">
        <h3 className="text-lg font-semibold">{t(field)}</h3><div className="prose prose-sm mt-2 wrap-anywhere dark:prose-invert" dangerouslySetInnerHTML={{ __html: leader[field] }} />
      </section>)}</div>}
      {video && <section className="mt-7"><h3 className="mb-3 text-lg font-semibold">{t('video')}</h3><StreamVideo uid={video.media_id} title={video.title} className="overflow-hidden rounded-lg" /></section>}
      <LeaderContactsPanel communityId={leader.community_id} leaderId={leader.id} contacts={contacts} canEdit={canEdit} />
      {canEdit && <LeaderMediaControls communityId={leader.community_id} leaderId={leader.id} media={media} />}
    </div>
  </article>;
}
