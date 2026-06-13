import Link from 'next/link';
import type { Route } from 'next';
import Avatar from '@/ui/Avatar';
import { getUserInitials } from '@/lib/user-helpers';
import { REACTION_CONFIGS, type Reaction } from '../../interfaces/reaction.interfaces';

interface ReactorListProps {
  isLoading: boolean;
  error: string | null;
  reactions: Reaction[];
  onNavigate: () => void;
}

export function ReactorList({ isLoading, error, reactions, onNavigate }: ReactorListProps) {
  return (
    <div className="max-h-[60vh] overflow-y-auto">
      {isLoading && (
        <div className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Cargando...
        </div>
      )}
      {!isLoading && error && (
        <div className="px-4 py-8 text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {!isLoading && !error && reactions.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          No hay reacciones en esta categoría.
        </div>
      )}
      {!isLoading && !error && reactions.length > 0 && (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {reactions.map((reaction) => (
            <ReactionRow key={reaction.id} reaction={reaction} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
    </div>
  );
}

interface ReactionRowProps {
  reaction: Reaction;
  onNavigate: () => void;
}

function ReactionRow({ reaction, onNavigate }: ReactionRowProps) {
  const user = reaction.user;
  const config = REACTION_CONFIGS[reaction.type];
  const displayName = user
    ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username
    : 'Usuario';
  const initials = getUserInitials(user?.username ?? '');
  const href = user?.username ? (`/${user.username}` as Route) : null;

  const content = (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="relative shrink-0">
        <Avatar src={user?.avatar} initials={initials} className="h-10 w-10" />
        <span
          aria-label={config.label}
          title={config.label}
          className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-700 text-sm"
        >
          {config.emoji}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
          {displayName}
        </p>
        {user?.username && (
          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            @{user.username}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <li>
        <Link
          href={href}
          onClick={onNavigate}
          className="block hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
        >
          {content}
        </Link>
      </li>
    );
  }
  return <li>{content}</li>;
}
