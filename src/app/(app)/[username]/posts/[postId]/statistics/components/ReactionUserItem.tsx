import { REACTION_CONFIGS, ReactionType } from '@/app/(app)/feed/reacions/interfaces/reaction.interfaces';
import type { ReactionUser } from '@/app/(app)/feed/post/interfaces/statistics.interfaces';
import Avatar from '@/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReactionUserItemProps {
  user: ReactionUser;
  reactionType: ReactionType;
}

/**
 * Item individual de un usuario que reaccionó
 * Muestra avatar con badge de reacción, nombre y timestamp
 */
export function ReactionUserItem({ user, reactionType }: ReactionUserItemProps) {
  const config = REACTION_CONFIGS[reactionType];
  
  const timeAgo = formatDistanceToNow(new Date(user.reactedAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar 
            src={user.avatar} 
            className="w-10 h-10"
          />
          {/* Badge de reacción en la esquina inferior derecha */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center border-2 border-white dark:border-neutral-800">
            <span className="text-sm">{config.emoji}</span>
          </div>
        </div>
        
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {timeAgo}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
      </div>
    </div>
  );
}
