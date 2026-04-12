import { ReactionType } from '@/app/(app)/feed/reacions/interfaces/reaction.interfaces';
import type { ReactionUser } from '@/app/(app)/feed/post/interfaces/statistics.interfaces';
import { ReactionUserItem } from './ReactionUserItem';

interface UserWithReaction extends ReactionUser {
  reactionType: ReactionType;
}

interface ReactionUserListProps {
  users: UserWithReaction[];
  emptyMessage?: string;
}

/**
 * Lista de usuarios que reaccionaron a un post
 * Muestra estado vacío si no hay usuarios
 */
export function ReactionUserList({ users, emptyMessage = 'Aún no hay reacciones' }: ReactionUserListProps) {
  if (users.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-neutral-700">
      {users.map((user) => (
        <ReactionUserItem 
          key={`${user.id}-${user.reactionType}`}
          user={user}
          reactionType={user.reactionType}
        />
      ))}
    </div>
  );
}
