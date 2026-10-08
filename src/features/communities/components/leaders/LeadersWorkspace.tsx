'use client';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui/Button';
import Select from '@/ui/Select';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import type { LeaderCategory, LeaderSummary } from '../../types/communityLeader.types';
import type { CommunitySection, PlanPage, ProfileCapabilities } from '../../types/communityPlan.types';
import { loadCommunityLeaders, loadLeaderCategories } from '../../actions/leaders/queries.actions';
import { usePlanPage } from '../../hooks/usePlanPage';
import { useEditorReturnFocus } from '../../hooks/useEditorReturnFocus';
import { PlanInteractionProvider, usePlanInteraction } from '../plans/PlanInteractionProvider';
import { PlanSectionSettings } from '../plans/PlanSectionSettings';
import { PlanFeedback } from '../plans/PlanFeedback';
import { LeaderCategoryManager } from './LeaderCategoryManager';
import { LeaderCard } from './LeaderCard';
import { LeaderForm } from './LeaderForm';

type Props = { communityId: string; slug: string; section?: CommunitySection; capabilities: ProfileCapabilities;
  categories: PlanPage<LeaderCategory>; leaders: PlanPage<LeaderSummary>; categoryId?: string | null; selectedCategory?: LeaderCategory | null };
export function LeadersWorkspace(props: Props) { return <PlanInteractionProvider><Workspace {...props} /></PlanInteractionProvider>; }
function Workspace({ communityId, slug, section, capabilities, categories: initialCategories, leaders: initialLeaders, categoryId, selectedCategory }: Props) {
  const t = useTranslations('communities.leaders');
  const router = useRouter();
  const interaction = usePlanInteraction();
  const opener = useEditorReturnFocus('new-leader');
  const categories = usePlanPage(initialCategories, (cursor) => loadLeaderCategories({ communityId, sectionId: section?.id, cursor }));
  const leaders = usePlanPage(initialLeaders, (cursor) => loadCommunityLeaders({ communityId, sectionId: section?.id, categoryId, cursor }));
  const options = selectedCategory && !categories.items.some((item) => item.id === selectedCategory.id) ? [...categories.items, selectedCategory] : categories.items;
  const locked = interaction.busy || !!interaction.editor;
  return <section className="min-w-0 rounded-xl bg-white p-4 text-neutral-900 sm:p-6 dark:bg-neutral-800 dark:text-white">
    <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="min-w-0 flex-1 text-xl font-semibold wrap-anywhere">{section?.title ?? t('title')}</h2>
      {section && capabilities.content && <Button ref={opener} color="brand" disabled={locked} onClick={() => interaction.beginEdit('new-leader')}>{t('add')}</Button>}</div>
    {capabilities.settings && <PlanSectionSettings communityId={communityId} kind="leaders" section={section} />}
    {!section ? <p className="mt-5 text-sm text-neutral-600 dark:text-neutral-300">{t('setup')}</p> : <>
      <div className="mt-5 flex flex-wrap items-end gap-3"><label className="min-w-48 flex-1 text-sm font-medium">{t('category')}
        <Select disabled={locked} value={categoryId === null ? 'none' : categoryId ?? 'all'} className="mt-2" onChange={(event) => {
          const value = event.target.value; router.push((`/feed/comunidades/${encodeURIComponent(slug)}/lideres${value === 'all' ? '' : `?categoria=${value}`}`) as Route);
        }}><option value="all">{t('all')}</option><option value="none">{t('uncategorized')}</option>{options.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</Select>
      </label>{categories.nextCursor && <Button outline disabled={interaction.busy || (!!interaction.editor && interaction.editor !== 'new-leader') || categories.pending} onClick={categories.loadMore}>{t(categories.pending ? 'loading' : 'moreCategories')}</Button>}</div>
      <PlanFeedback error={categories.error} />
      {capabilities.content && <LeaderCategoryManager communityId={communityId} sectionId={section.id} categories={options} />}
      {interaction.editor === 'new-leader' && <LeaderForm communityId={communityId} sectionId={section.id} categories={options} editorId="new-leader" onClose={interaction.endEdit} />}
      {!leaders.items.length ? <p className="py-8 text-sm text-neutral-600 dark:text-neutral-300">{t(capabilities.content ? 'emptyEditor' : 'emptyReader')}</p>
        : <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{leaders.items.map((leader) => <LeaderCard key={leader.id} leader={leader} slug={slug} canEdit={capabilities.content} />)}</div>}
      {leaders.nextCursor && <Button outline className="mt-5" disabled={locked || leaders.pending} onClick={leaders.loadMore}>{t(leaders.pending ? 'loading' : 'more')}</Button>}
      <PlanFeedback error={leaders.error} />
    </>}
  </section>;
}
