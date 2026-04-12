import { REACTION_CONFIGS, ReactionType } from '@/app/(app)/feed/reacions/interfaces/reaction.interfaces';

interface ReactionTabsProps {
  activeTab: 'all' | ReactionType;
  onTabChange: (tab: 'all' | ReactionType) => void;
  totalReactions: number;
  reactionCounts: Record<ReactionType, number>;
}

/**
 * Tabs horizontales para filtrar por tipo de reacción
 * Muestra solo las reacciones que tienen count > 0
 */
export function ReactionTabs({ 
  activeTab, 
  onTabChange, 
  totalReactions, 
  reactionCounts 
}: ReactionTabsProps) {
  if (totalReactions === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-neutral-700 overflow-x-auto">
      {/* Tab "Todos" */}
      <button
        onClick={() => onTabChange('all')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
          ${activeTab === 'all'
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600'
          }
        `}
      >
        <span>Todos</span>
        <span className="text-xs opacity-75">{totalReactions}</span>
      </button>

      {/* Tabs por tipo de reacción */}
      {(Object.keys(reactionCounts) as ReactionType[]).map((type) => {
        const count = reactionCounts[type];
        if (count === 0) return null;
        
        const config = REACTION_CONFIGS[type];
        
        return (
          <button
            key={type}
            onClick={() => onTabChange(type)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
              ${activeTab === type
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600'
              }
            `}
          >
            <span className="text-lg">{config.emoji}</span>
            <span className="text-xs opacity-75">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
