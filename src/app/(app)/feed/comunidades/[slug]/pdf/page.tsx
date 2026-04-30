import { ComingSoonPanel } from '@/features/communities/components/ComingSoonPanel';
import { CommunityTopTabs } from '@/features/communities/components/CommunityTopTabs';
import { DocumentIcon } from '@/components/icons/heroicons-shim';

export default async function CommunityPdfPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="space-y-5">
      <CommunityTopTabs slug={slug} />
      <ComingSoonPanel
        title="Documentos PDF"
        description="Sube y comparte PDFs con los miembros. Disponible próximamente."
        icon={DocumentIcon}
      />
    </div>
  );
}
