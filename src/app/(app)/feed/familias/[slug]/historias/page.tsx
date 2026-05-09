import { notFound } from 'next/navigation';
import {
  getFamilyBySlug,
  getFamilyStories,
} from '@/features/families/server/families.server';
import { FamilyStoriesList } from '@/features/families/components/FamilyStoriesList';
import { AddStoryDialog } from '@/features/families/components/AddStoryDialog';

export const metadata = { title: 'Historias' };

export default async function FamilyStoriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const family = await getFamilyBySlug(slug);
  if (!family) notFound();
  if (!family.viewer_role) return null;

  const stories = await getFamilyStories(family.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Historias ({stories.length})
        </h2>
        <AddStoryDialog familyId={family.id} />
      </div>
      <FamilyStoriesList stories={stories} />
    </div>
  );
}
