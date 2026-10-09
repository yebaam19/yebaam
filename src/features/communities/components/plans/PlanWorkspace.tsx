'use client';

import { useTranslations } from 'next-intl';
import type { CommunitySection, PlanAxis, PlanKind, PlanPage, PlanPoint, ProfileCapabilities } from '../../types/communityPlan.types';
import { PlanSectionSettings } from './PlanSectionSettings';
import { PlanAxes } from './PlanAxes';
import { PlanPoints } from './PlanPoints';
import { PlanItemForm } from './PlanItemForm';
import { PlanInteractionProvider, usePlanInteraction } from './PlanInteractionProvider';

type Props = {
  section: CommunitySection; axes: PlanPage<PlanAxis>; selectedAxis: PlanAxis | null;
  points: PlanPage<PlanPoint>; capabilities: ProfileCapabilities; basePath: string;
};
export function PlanWorkspace(props: Props) {
  return <PlanInteractionProvider><PlanWorkspaceContent {...props} /></PlanInteractionProvider>;
}
function PlanWorkspaceContent({ section, axes, selectedAxis, points, capabilities, basePath }: Props) {
  const t = useTranslations('communities.plans');
  const interaction = usePlanInteraction();
  const isRules = section.kind === 'rules';
  const introKey = capabilities.plans ? 'editorIntro' : 'readerIntro';
  return <section className="rounded-xl bg-white p-4 text-neutral-900 sm:p-6 dark:bg-neutral-800 dark:text-white">
    <header className="mb-4 border-b border-neutral-200 pb-4 dark:border-neutral-700">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold wrap-anywhere">{section.title}</h2>
        {!section.is_visible && <span className="text-sm text-secondary-900 dark:text-secondary-300">{t('hiddenSection')}</span>}
      </div>
      <p className="mt-2 max-w-prose text-sm text-neutral-600 dark:text-neutral-300">{t(isRules ? `rules.${introKey}` : introKey)}</p>
      {capabilities.settings && <PlanSectionSettings key={section.version} communityId={section.community_id}
        kind={section.kind as PlanKind} section={section} />}
    </header>
    {interaction.editor && <p role="status" className="mb-4 text-sm text-neutral-600 dark:text-neutral-300">{t(isRules ? 'rules.finishEditing' : 'finishEditing')}</p>}
    {interaction.editor === 'new-axis' && <PlanItemForm communityId={section.community_id} sectionId={section.id} kind="axis"
      isRules={isRules} editorId="new-axis" basePath={basePath} onClose={interaction.endEdit} />}
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(180px,1fr)_minmax(0,3fr)]">
      <PlanAxes section={section} initial={axes} selectedId={selectedAxis?.id} basePath={basePath}
        canEdit={capabilities.plans} onCreate={() => interaction.beginEdit('new-axis')} />
      {selectedAxis ? <PlanPoints key={selectedAxis.id} axis={selectedAxis} initial={points}
        axes={axes} basePath={basePath} canEdit={capabilities.plans} isRules={isRules} />
        : <p className="py-6 text-neutral-600 dark:text-neutral-300">{t(isRules ? 'rules.emptyPlan' : 'emptyPlan')}</p>}
    </div>
  </section>;
}
