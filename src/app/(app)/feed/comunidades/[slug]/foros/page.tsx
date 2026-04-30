import Link from 'next/link';
import type { Route } from 'next';
import { notFound } from 'next/navigation';
import {
  getCommunityBySlug,
  getViewerJoinState,
} from '@/features/communities/server/communities.server';
import {
  getSpaceBoardByOwner,
  getSpaceByOwner,
  isSpaceAdmin,
} from '@/app/(app)/foro/server/foro.server';
import { enableForumForOwner } from '@/features/foro/actions/admin.actions';
import SpaceBoard from '@/features/foro/components/SpaceBoard';
import { Badge } from '@/ui/Badge';
import { Button } from '@/ui/Button';
import {
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftRightIcon,
} from '@/components/icons/heroicons-shim';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CommunityForumsPage({ params }: PageProps) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const viewerState = await getViewerJoinState(community.id);
  const isOwner = viewerState.kind === 'owner';

  let board = await getSpaceBoardByOwner('community', community.id);

  // Auto-provision the forum space the first time the owner visits the page.
  if (!board && isOwner) {
    const result = await enableForumForOwner({
      ownerType: 'community',
      ownerId: community.id,
    });
    if (result.ok) {
      board = await getSpaceBoardByOwner('community', community.id);
    }
  }

  if (!board) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
          <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Foros de la comunidad
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          El propietario aún no ha activado los foros para esta comunidad.
        </p>
      </div>
    );
  }

  const { space, categories } = board;
  const userIsAdmin = await isSpaceAdmin(space.id);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Foros · {space.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <Badge color="orange">Comunidad</Badge>
            {space.visibility !== 'public' && (
              <Badge color="amber">
                {space.visibility === 'private' ? 'Privado' : 'Secreto'}
              </Badge>
            )}
            {space.description && (
              <span className="text-neutral-600 dark:text-neutral-400">
                {space.description}
              </span>
            )}
          </div>
        </div>
        {userIsAdmin && (
          <Button
            href={`/foro/${space.slug}/admin` as Route}
            outline
            className="w-full sm:w-auto"
          >
            Administrar foro
          </Button>
        )}
      </header>

      {categories.length > 0 ? (
        <SpaceBoard space={space} categories={categories} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center text-sm text-gray-600 dark:text-gray-400">
          {userIsAdmin ? (
            <>
              <p className="mb-3">
                Aún no hay categorías. Crea la primera desde el panel de administración.
              </p>
              <Link
                href={`/foro/${space.slug}/admin` as Route}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Ir al panel
              </Link>
            </>
          ) : (
            'Aún no se han creado categorías en este foro.'
          )}
        </div>
      )}
    </div>
  );
}
