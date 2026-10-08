import { CommunityLibraryPage } from '@/features/communities/components/library/CommunityLibraryPage';

export default async function Page({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; carpeta?: string }>;
}) {
  const { slug } = await params;
  return <CommunityLibraryPage slug={slug} kind="image" searchParams={await searchParams} />;
}
