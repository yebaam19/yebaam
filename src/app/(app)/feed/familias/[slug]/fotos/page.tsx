import { notFound } from 'next/navigation';
import {
  getFamilyBySlug,
  getFamilyPersons,
  getFamilyPhotos,
} from '@/features/families/server/families.server';
import { FamilyPhotosGrid } from '@/features/families/components/FamilyPhotosGrid';
import { UploadPhotoDialog } from '@/features/families/components/UploadPhotoDialog';

export const metadata = { title: 'Fotos' };

export default async function FamilyPhotosPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const family = await getFamilyBySlug(slug);
  if (!family) notFound();
  if (!family.viewer_role) return null;

  const [photos, persons] = await Promise.all([
    getFamilyPhotos(family.id),
    getFamilyPersons(family.id),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Fotos ({photos.length})
        </h2>
        <UploadPhotoDialog familyId={family.id} persons={persons} />
      </div>
      <FamilyPhotosGrid photos={photos} />
    </div>
  );
}
