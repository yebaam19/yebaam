'use client';

import { useParams } from 'next/navigation';
import { usePageBySlug } from '@/features/pages/hooks/usePages';
import { usePageConversations } from '@/features/pages/hooks/usePageMessages';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { isArtistPageCategory } from '@/features/pages/config/page-tabs';
import { PageArtistShell } from '@/features/pages/components/detail/layout/PageArtistShell';
import { PageBusinessShell } from '@/features/pages/components/detail/layout/PageBusinessShell';
import { PageMessagesButton } from '@/features/pages/components/messages/PageMessagesButton';

export default function PageDetailPage() {
  const params = useParams();
  const pageSlug = params.slug as string;
  const currentUser = useAuthStore((state) => state.user);

  const { data: pageResponse, isLoading, error } = usePageBySlug(pageSlug);
  const page = pageResponse?.page;
  const isOwner = Boolean(currentUser?.id && currentUser.id === page?.ownerId);

  const { data: conversationsData } = usePageConversations(
    isOwner ? page?.id : undefined,
    { page: 1, limit: 50, includeArchived: false }
  );
  const unreadCount =
    conversationsData?.conversations.reduce((sum, conv) => sum + conv.unreadCount, 0) ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando página...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Página no encontrada
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            La página que buscas no existe o ha sido eliminada.
          </p>
        </div>
      </div>
    );
  }

  // El layout del PDF (wireframe pág. 13) es el de la página de artista/comunidad.
  // Las páginas de negocio conservan el layout histórico: mismo predicado que
  // decide sus pestañas y su menú lateral, para que los tres no diverjan.
  if (isArtistPageCategory(page.category)) {
    return <PageArtistShell page={page} isOwner={isOwner} unreadCount={unreadCount} />;
  }

  return (
    <>
      <PageBusinessShell page={page} isOwner={isOwner} />
      {isOwner && <PageMessagesButton pageId={page.id} unreadCount={unreadCount} />}
    </>
  );
}
