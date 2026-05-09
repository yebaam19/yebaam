import { notFound } from 'next/navigation';
import {
  getFamilyBySlug,
  getFamilyDocuments,
} from '@/features/families/server/families.server';
import { FamilyDocumentsList } from '@/features/families/components/FamilyDocumentsList';
import { UploadDocumentDialog } from '@/features/families/components/UploadDocumentDialog';

export const metadata = { title: 'Documentos' };

export default async function FamilyDocumentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const family = await getFamilyBySlug(slug);
  if (!family) notFound();
  if (!family.viewer_role) return null;

  const documents = await getFamilyDocuments(family.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Documentos ({documents.length})
        </h2>
        <UploadDocumentDialog familyId={family.id} />
      </div>
      <FamilyDocumentsList documents={documents} />
    </div>
  );
}
