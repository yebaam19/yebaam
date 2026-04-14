import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { useReactionStore } from '../../store/reaction.store';
import { REACTION_CONFIGS, ReactionType } from '../../interfaces/reaction.interfaces';
import { ReactionPicker } from '../ReactionPicker/ReactionPicker';

interface ReactionButtonProps {
  postId: string;
  className?: string;
}

/**
 * Botón de reacción con hover para mostrar picker
 * Muestra el estado actual de la reacción del usuario
 */
export function ReactionButton({ postId, className = '' }: ReactionButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { myReactionsByPost, reactToPost, unreactToPost, updateReaction, fetchMyReaction } =
    useReactionStore();
  const myReaction = myReactionsByPost[postId];

  // Cargar reacción del usuario desde Supabase (persiste entre sesiones; el store es solo en memoria)
  useEffect(() => {
    if (!postId || !user?.id) return;
    void fetchMyReaction(postId);
  }, [postId, user?.id, fetchMyReaction]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Mostrar picker después de 300ms (como Facebook)
    timeoutRef.current = setTimeout(() => {
      setShowPicker(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Ocultar picker después de 200ms
    timeoutRef.current = setTimeout(() => {
      setShowPicker(false);
    }, 200);
  };

  const handleClick = async () => {
    if (myReaction) {
      // Si ya reaccionó, quitar reacción
      await unreactToPost(postId);
    } else {
      // Si no ha reaccionado, dar Like por defecto
      await reactToPost(postId, ReactionType.LIKE);
    }
  };

  const handleReactionSelect = async (type: ReactionType) => {
    setShowPicker(false);
    if (myReaction) {
      await updateReaction(postId, type);
    } else {
      await reactToPost(postId, type);
    }
  };

  // Configuración visual según el estado
  const config = myReaction ? REACTION_CONFIGS[myReaction.type] : null;
  const buttonColor = config?.color || 'text-gray-500';
  const buttonLabel = config?.label || 'Me gusta';
  const emoji = config?.emoji;

  return (
    <div
      ref={buttonRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Botón principal */}
      <button
        onClick={handleClick}
        className={`
          flex items-center gap-1.5 px-4 py-2 rounded-lg
          font-medium text-sm transition-all
          hover:bg-gray-100 dark:hover:bg-gray-800
          ${myReaction ? buttonColor : 'text-gray-600 dark:text-gray-400'}
          ${className}
        `}
        aria-label={buttonLabel}
      >
        {emoji ? (
          <span className="text-lg" aria-hidden="true">
            {emoji}
          </span>
        ) : (
          // Icono de Like por defecto
          <svg
            className="w-5 h-5"
            fill={myReaction ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
            />
          </svg>
        )}
        <span>{buttonLabel}</span>
      </button>

      {/* Picker flotante */}
      {showPicker && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <ReactionPicker
            onSelect={handleReactionSelect}
            currentReaction={myReaction?.type}
          />
        </div>
      )}
    </div>
  );
}
