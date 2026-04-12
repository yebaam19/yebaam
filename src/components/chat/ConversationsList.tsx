import ConversationItem from './ConversationItem';

interface ProcessedConversation {
  id: string;
  otherParticipantId?: string;
  displayName: string;
  displayAvatar: string;
  isOnline: boolean;
  lastMessage?: {
    content: string;
    createdAt: Date;
  } | null;
  formattedTimestamp: string;
  unreadCount: number;
}

interface ActiveChat {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

interface ConversationsListProps {
  conversations: ProcessedConversation[];
  activeChat: ActiveChat | null;
  searchQuery: string;
  onSelectChat: (chat: ActiveChat) => void;
}

export default function ConversationsList({
  conversations,
  activeChat,
  searchQuery,
  onSelectChat,
}: ConversationsListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {searchQuery ? 'No se encontraron conversaciones' : 'No tienes conversaciones aún'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          id={conversation.id}
          displayName={conversation.displayName}
          displayAvatar={conversation.displayAvatar}
          lastMessageContent={conversation.lastMessage?.content}
          formattedTimestamp={conversation.formattedTimestamp}
          unreadCount={conversation.unreadCount}
          isActive={activeChat?.id === conversation.id}
          isOnline={conversation.isOnline}
          onClick={() =>
            onSelectChat({
              id: conversation.otherParticipantId || conversation.id,
              name: conversation.displayName,
              avatar: conversation.displayAvatar,
              isOnline: conversation.isOnline,
            })
          }
        />
      ))}

      <div className="mt-4 px-3">
        <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2">
          Contactos conectados
        </h3>
      </div>
    </div>
  );
}
