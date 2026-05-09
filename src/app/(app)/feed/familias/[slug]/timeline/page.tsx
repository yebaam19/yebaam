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
import { UploadPhotoDialog } from '@/features/families/components/UploadPhotoDialog';
import { AddStoryDialog } from '@/features/families/components/AddStoryDialog';
import { UploadDocumentDialog } from '@/features/families/components/UploadDocumentDialog';

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

  const stats = [
    { count: events.length, label: events.length === 1 ? 'evento' : 'eventos' },
    { count: photos.length, label: photos.length === 1 ? 'foto' : 'fotos' },
    { count: stories.length, label: stories.length === 1 ? 'historia' : 'historias' },
    { count: documents.length, label: documents.length === 1 ? 'documento' : 'documentos' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Línea de tiempo
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {stats.map((s, i) => (
              <span key={s.label}>
                {i > 0 && <span aria-hidden> · </span>}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{s.count}</span>{' '}
                {s.label}
              </span>
            ))}
          </p>
        </div>
        <AddEventDialog familyId={family.id} persons={persons} />
      </div>

      <FamilyTimeline
        events={events}
        photos={photos}
        stories={stories}
        documents={documents}
        emptyActions={
          <>
            <AddEventDialog familyId={family.id} persons={persons} />
            <UploadPhotoDialog familyId={family.id} persons={persons} />
            <AddStoryDialog familyId={family.id} />
            <UploadDocumentDialog familyId={family.id} />
          </>
        }
      />
    </div>
  );
}
