import 'server-only';
import { notFound } from 'next/navigation';
import { getCommunityBySlug } from '../../server/communities.server';
import { getCommunitySections, getCommunityProfileCapabilities } from '../../server/community-plan.server';
import { getCommunityAbout, getAboutMedia } from '../../server/community-about.server';
import { AboutWorkspace } from './AboutWorkspace';

export async function CommunityAboutPage({ slug }: { slug: string }) {
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();
  const [sections, capabilities, about] = await Promise.all([
    getCommunitySections(community.id), getCommunityProfileCapabilities(community.id), getCommunityAbout(community.id),
  ]);
  const section = sections.find((item) => item.kind === 'about');
  if (!section && !capabilities.settings) notFound();
  const media = about ? await getAboutMedia(community.id, about.id) : { items: [], nextCursor: null };
  return <AboutWorkspace key={crypto.randomUUID()} communityId={community.id} name={community.name}
    section={section} capabilities={capabilities} about={about} media={media} />;
}
