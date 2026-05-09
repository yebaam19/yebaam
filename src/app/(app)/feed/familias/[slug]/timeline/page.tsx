import { notFound } from 'next/navigation';
import {
  getFamilyBySlug,
  getFamilyDocuments,
  getFamilyEvents,
  getFamilyPersons,
  getFamilyPhotos,
  getFamilyStories,
} from '@/features/families/server/families.server';
import { FamilyTimeline } from '@/features/families/components/FamilyTimeline';
import { AddEventDialog } from '@/features/families/components/AddEventDialog';

export const metadata = { title: 'Línea de tiempo' };

export default async function FamilyTimelinePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const family = await getFamilyBySlug(slug);
  if (!family) notFound();
  if (!family.viewer_role) return null;

  const [events, photos, stories, documents, persons] = await Promise.all([
    getFamilyEvents(family.id),
    getFamilyPhotos(family.id),
    getFamilyStories(family.id),
    getFamilyDocuments(family.id),
    getFamilyPersons(family.id),
  ]);

  const total = events.length + photos.length + stories.length + documents.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Línea de tiempo ({total})
        </h2>
        <AddEventDialog familyId={family.id} persons={persons} />
      </div>
      <FamilyTimeline events={events} photos={photos} stories={stories} documents={documents} />
    </div>
  );
}
