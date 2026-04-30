import Link from 'next/link';
import type { Route } from 'next';
import {
  ChatBubbleLeftRightIcon,
  LockClosedIcon,
} from '@/components/icons/heroicons-shim';
import { getOrCreateCommunityChatTopic } from '@/features/communities/server/community-chat.server';
import type { ViewerJoinState } from '@/features/communities/server/communities.server';
import type { Community } from '@/features/communities/types/community.types';

interface CommunityChatPanelProps {
  community: Community;
  viewerState: ViewerJoinState;
}

export async function CommunityChatPanel({ community, viewerState }: CommunityChatPanelProps) {
  const isMember =
    viewerState.kind === 'owner' || viewerState.kind === 'member' || community.isMember;

  if (!isMember) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
          <LockClosedIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Solo para miembros
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Únete a la comunidad para participar en el chat público en tiempo real.
        </p>
      </div>
    );
  }

  const topic = await getOrCreateCommunityChatTopic({
    id: community.id,
    slug: community.slug,
    name: community.name,
  });

  if (!topic) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-10 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">
          No se pudo cargar el chat de la comunidad. Intenta más tarde.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{topic.name}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Sala de chat público en tiempo real para los miembros de la comunidad.
          </p>
          <Link
            href={`/feed/chat-publico/${topic.slug}` as Route}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            Entrar al chat
          </Link>
        </div>
      </div>
    </div>
  );
}
