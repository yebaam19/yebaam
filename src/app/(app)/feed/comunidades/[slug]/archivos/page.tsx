import { ComingSoonPanel } from '@/features/communities/components/ComingSoonPanel';
import { CommunityTopTabs } from '@/features/communities/components/CommunityTopTabs';
import { FolderIcon } from '@/components/icons/heroicons-shim';

export default async function CommunityFilesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="space-y-5">
      <CommunityTopTabs slug={slug} />
      <ComingSoonPanel
        title="Archivos"
        description="Pronto los miembros podrán compartir archivos relevantes para la comunidad."
        icon={FolderIcon}
      />
    </div>
  );
}
