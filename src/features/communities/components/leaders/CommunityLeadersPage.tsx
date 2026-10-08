import 'server-only';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { getCommunityBySlug } from '../../server/communities.server';
import { getCommunitySections, getCommunityProfileCapabilities } from '../../server/community-plan.server';
import { getLeaderCategories, getLeaderCategory, getCommunityLeaders, getCommunityLeader, getLeaderContacts, getLeaderMedia } from '../../server/community-leaders.server';
import { LeadersWorkspace } from './LeadersWorkspace';
import { LeaderDetailWorkspace } from './LeaderDetailWorkspace';

export async function CommunityLeadersPage({ slug, category }: { slug: string; category?: string }) {
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();
  const categoryId = category === 'none' ? null : category;
  if (categoryId && !z.uuid().safeParse(categoryId).success) notFound();
  const [sections, capabilities] = await Promise.all([getCommunitySections(community.id), getCommunityProfileCapabilities(community.id)]);
  const section = sections.find((item) => item.kind === 'leaders');
  if (!section && !capabilities.settings) notFound();
  const [categories, leaders, selectedCategory] = section ? await Promise.all([
    getLeaderCategories(community.id, section.id), getCommunityLeaders(community.id, section.id, categoryId),
    categoryId ? getLeaderCategory(community.id, categoryId) : null,
  ]) : [{ items: [], nextCursor: null }, { items: [], nextCursor: null }, null];
  if (categoryId && !selectedCategory) notFound();
  return <LeadersWorkspace key={crypto.randomUUID()} communityId={community.id} slug={slug} section={section}
    capabilities={capabilities} categories={categories} leaders={leaders} categoryId={categoryId} selectedCategory={selectedCategory} />;
}
export async function CommunityLeaderPage({ slug, leaderId }: { slug: string; leaderId: string }) {
  if (!z.uuid().safeParse(leaderId).success) notFound();
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();
  const leader = await getCommunityLeader(community.id, leaderId);
  if (!leader) notFound();
  const [capabilities, categories, category, contacts, media] = await Promise.all([
    getCommunityProfileCapabilities(community.id), getLeaderCategories(community.id, leader.section_id),
    leader.category_id ? getLeaderCategory(community.id, leader.category_id) : null,
    getLeaderContacts(community.id, leader.id), getLeaderMedia(community.id, leader.id),
  ]);
  return <LeaderDetailWorkspace key={crypto.randomUUID()} slug={slug} leader={leader} categories={categories}
    category={category} contacts={contacts} media={media} canEdit={capabilities.content} />;
}
