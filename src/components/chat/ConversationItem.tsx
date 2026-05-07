import Avatar from '@/ui/Avatar';
import type { MessageMedia } from '@/features/chat/types';

interface LastMessagePreview {
  content: string;
  media?: MessageMedia | null;
}

interface ConversationItemProps {
  id: string;
  displayName: string;
  displayAvatar: string;
  lastMessage?: LastMessagePreview | null;
  formattedTimestamp?: string;
  unreadCount: number;
  isActive: boolean;
  isOnline?: boolean;
  onClick: () => void;
}

function getPreviewText(lastMessage: LastMessagePreview | null | undefined): string {
  if (!lastMessage) return 'Sin mensajes';
  if (lastMessage.content && lastMessage.content.length > 0) return lastMessage.content;
  const media = lastMessage.media;
  if (media?.type === 'image') return '📷 Foto';
  if (media?.type === 'video') return '🎥 Video';
  if (media) return '📎 Archivo';
  return 'Sin mensajes';
}

export default function ConversationItem({
  displayName,
  displayAvatar,
  lastMessage,
  formattedTimestamp,
  unreadCount,
  isActive,
  isOnline = false,
  onClick,
}: ConversationItemProps) {
  const messageText = getPreviewText(lastMessage);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
        isActive ? 'bg-neutral-100 dark:bg-neutral-800' : ''
      }`}
    >
      <div className="relative">
        <Avatar
          src={displayAvatar}
          alt={displayName}
          initials={displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          className="h-12 w-12"
        />
        {isOnline && (
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-neutral-900" />
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm text-neutral-900 dark:text-white truncate">
            {displayName}
          </span>
          {formattedTimestamp && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400 shrink-0 ml-2">
              {formattedTimestamp}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
            {messageText}
          </p>
          {unreadCount > 0 && (
            <span className="shrink-0 ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
