import { CommunityAboutPage } from '@/features/communities/components/about/CommunityAboutPage';

export default async function AboutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CommunityAboutPage slug={slug} />;
}
