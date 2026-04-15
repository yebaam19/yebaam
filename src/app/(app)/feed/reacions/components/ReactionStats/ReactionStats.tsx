import { REACTION_CONFIGS, ReactionType } from '../../interfaces/reaction.interfaces';
import type { ReactionsCount } from '@/app/(app)/feed/post/interfaces/post.interfaces';

interface ReactionStatsProps {
  reactionsCount: ReactionsCount; // Recibir directamente del post
  className?: string;
  showTopReactions?: boolean;
  maxTopReactions?: number;
}

/**
 * Muestra las estadísticas de reacciones de un post
 * Incluye emojis de las top reacciones y el total
 * Los datos vienen directamente del post, no del store de reacciones
 */
export function ReactionStats({
  reactionsCount,
  className = '',
  showTopReactions = true,
  maxTopReactions = 3,
}: ReactionStatsProps) {
  if (!reactionsCount) return null;

  // Convertir ReactionsCount a formato compatible
  const counts = {
    LIKE: reactionsCount.like || 0,
    LOVE: reactionsCount.love || 0,
    HAHA: reactionsCount.haha || 0,
    WOW: reactionsCount.wow || 0,
    SAD: reactionsCount.sad || 0,
    ANGRY: reactionsCount.angry || 0,
  };

  // Calcular total de reacciones
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  if (total === 0) return null;

  // Obtener top reacciones ordenadas por cantidad
  const topReactions = Object.entries(counts)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxTopReactions)
    .map(([type]) => type as ReactionType);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Top reacciones (emojis) */}
      {showTopReactions && topReactions.length > 0 && (
        <div className="flex items-center -space-x-1">
          {topReactions.map(type => {
            const config = REACTION_CONFIGS[type];
            return (
              <span
                key={type}
                className="
                  w-5 h-5 rounded-full
                  bg-white dark:bg-gray-800
                  border border-gray-200 dark:border-gray-700
                  flex items-center justify-center
                  text-xs
                "
                title={`${counts[type]} ${config.label}`}
                aria-label={`${counts[type]} ${config.label}`}
              >
                {config.emoji}
              </span>
            );
          })}
        </div>
      )}

      {/* Total de reacciones */}
      <span
        className="text-sm text-gray-600 dark:text-gray-400"
        aria-label={`${total} reacciones en total`}
      >
        {total.toLocaleString()}
      </span>
    </div>
  );
}
