import { notFound } from 'next/navigation';
import { getCommunityBySlug } from '@/features/communities/server/communities.server';
import { GlobeAltIcon, LinkIcon } from '@/components/icons/heroicons-shim';

export default async function CommunityLinksPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
        Enlaces a páginas relacionadas
      </h2>
      {community.website ? (
        <a
          href={community.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
            <GlobeAltIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm text-gray-900 dark:text-white">Sitio web oficial</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{community.website}</p>
          </div>
        </a>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-sm text-gray-500 dark:text-gray-400 text-center">
          <LinkIcon className="h-6 w-6 mx-auto mb-2 text-gray-400" />
          Esta comunidad aún no ha agregado enlaces externos.
        </div>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
        Próximamente podrás añadir múltiples enlaces y categorizarlos.
      </p>
    </div>
  );
}
