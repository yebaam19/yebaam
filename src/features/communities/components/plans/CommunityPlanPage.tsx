import 'server-only';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { getCommunityBySlug } from '../../server/communities.server';
import { getCommunitySections, getCommunityProfileCapabilities, getPlanAxes, getPlanAxis, getPlanPoints, usesStructuredRules } from '../../server/community-plan.server';
import type { PlanKind } from '../../types/communityPlan.types';
import { planPath } from '../../utils/plan-navigation';
import { RulesList } from '../CommunityRulesPanel/RulesList';
import { PlanWorkspace } from './PlanWorkspace';
import { PlanSectionSettings } from './PlanSectionSettings';

export async function CommunityPlanPage({ slug, kind, axisId }: { slug: string; kind: PlanKind; axisId?: string }) {
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();
  const [sections, capabilities, t] = await Promise.all([
    getCommunitySections(community.id), getCommunityProfileCapabilities(community.id), getTranslations('communities.plans'),
  ]);
  const section = sections.find((item) => item.kind === kind);
  if (!section) {
    const migrated = kind === 'rules' && await usesStructuredRules(community.id);
    const legacyRules = kind === 'rules' && !migrated ? [...(community.rules ?? [])].sort((a, b) => a.order - b.order) : [];
    if (!capabilities.settings && !legacyRules.length) notFound();
    return <section className="rounded-xl bg-white p-6 text-neutral-900 dark:bg-neutral-800 dark:text-white">
      <h2 className="mb-4 text-2xl font-semibold">{t(`titles.${kind}`)}</h2>
      {legacyRules.length ? <RulesList rules={legacyRules} isOwner={capabilities.settings} /> : <p>{t(kind === 'rules' ? 'rules.setupHint' : 'setupHint')}</p>}
      {capabilities.settings && <PlanSectionSettings communityId={community.id} kind={kind} hasLegacyRules={legacyRules.length > 0} />}
    </section>;
  }
  const axes = await getPlanAxes(community.id, section.id);
  const validAxisId = z.uuid().safeParse(axisId);
  const selectedAxis = validAxisId.success
    ? await getPlanAxis(community.id, section.id, validAxisId.data) ?? axes.items[0] ?? null
    : axes.items[0] ?? null;
  const points = selectedAxis
    ? await getPlanPoints(community.id, section.id, selectedAxis.id)
    : { items: [], nextCursor: null };

  // A new server snapshot replaces all client pages, including later pages
  // affected by mutations or permission changes. The key is serialized by RSC.
  return <PlanWorkspace key={crypto.randomUUID()} section={section} axes={axes} selectedAxis={selectedAxis}
    points={points} capabilities={capabilities} basePath={planPath(slug, kind)} />;
}
