import { ComingSoonPanel } from '@/features/communities/components/ComingSoonPanel';
import { CommunityTopTabs } from '@/features/communities/components/CommunityTopTabs';
import { NewspaperIcon } from '@/components/icons/heroicons-shim';

export default async function CommunityArticlesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="space-y-5">
      <CommunityTopTabs slug={slug} />
      <ComingSoonPanel
        title="Artículos"
        description="Pronto los miembros podrán publicar artículos largos dentro de la comunidad."
        icon={NewspaperIcon}
      />
    </div>
  );
}
