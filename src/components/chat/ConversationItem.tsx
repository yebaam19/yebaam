import Avatar from '@/ui/Avatar';

interface ConversationItemProps {
  id: string;
  displayName: string;
  displayAvatar: string;
  lastMessageContent?: string | any; // Puede ser string u objeto {type, text}
  formattedTimestamp?: string;
  unreadCount: number;
  isActive: boolean;
  isOnline?: boolean;
  onClick: () => void;
}

export default function ConversationItem({
  displayName,
  displayAvatar,
  lastMessageContent,
  formattedTimestamp,
  unreadCount,
  isActive,
  isOnline = false,
  onClick,
}: ConversationItemProps) {
  // Extraer el texto del content - puede ser string u objeto
  const getContentText = (content: any): string => {
    if (!content) return 'Sin mensajes';
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
      return content.text || content._value || content.value || 'Sin mensajes';
    }
    return 'Sin mensajes';
  };

  const messageText = getContentText(lastMessageContent);

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
