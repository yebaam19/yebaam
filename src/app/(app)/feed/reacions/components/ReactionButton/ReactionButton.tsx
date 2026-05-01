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
 * Botón estilo Facebook: click rápido alterna "Me gusta", hover en escritorio
 * o long-press en móvil revela el picker con las 6 reacciones.
 */
export function ReactionButton({ postId, className = '' }: ReactionButtonProps) {
  const [showPicker, setShowPicker] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressFiredRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { myReactionsByPost, reactToPost, unreactToPost, updateReaction, fetchMyReaction } =
    useReactionStore();
  const myReaction = myReactionsByPost[postId];

  // Cargar reacción del usuario desde Supabase (persiste entre sesiones; el store es solo en memoria)
  useEffect(() => {
    if (!postId || !user?.id) return;
    void fetchMyReaction(postId);
  }, [postId, user?.id, fetchMyReaction]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    };
  }, []);

  // Cerrar el picker al tocar fuera (móvil) o presionar Escape
  useEffect(() => {
    if (!showPicker) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPicker(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showPicker]);

  const cancelHide = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const scheduleShow = () => {
    cancelHide();
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    showTimeoutRef.current = setTimeout(() => {
      setShowPicker(true);
    }, 300);
  };

  const scheduleHide = () => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setShowPicker(false);
    }, 250);
  };

  const handleClick = async () => {
    // Si el long-press disparó el picker, no procesar el click sintético posterior
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    if (myReaction) {
      await unreactToPost(postId);
    } else {
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

  // Long-press en móvil: tras 350 ms muestra el picker y cancela el click
  const handleTouchStart = () => {
    longPressFiredRef.current = false;
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    longPressTimeoutRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      setShowPicker(true);
    }, 350);
  };

  const handleTouchEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const config = myReaction ? REACTION_CONFIGS[myReaction.type] : null;
  const buttonLabel = config?.label || 'Me gusta';
  const emoji = config?.emoji;
  const colorStyle = config?.color ? { color: config.color } : undefined;

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={scheduleShow}
      onMouseLeave={scheduleHide}
    >
      <button
        type="button"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={colorStyle}
        className={`
          flex items-center gap-1.5 px-4 py-2 rounded-lg
          font-medium text-sm transition-all select-none
          hover:bg-gray-100 dark:hover:bg-gray-800
          ${myReaction ? '' : 'text-gray-600 dark:text-gray-400'}
          ${className}
        `}
        aria-label={buttonLabel}
        aria-expanded={showPicker}
        aria-haspopup="menu"
      >
        {emoji ? (
          <span className="text-lg leading-none" aria-hidden="true">
            {emoji}
          </span>
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
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

      {showPicker && (
        <div
          onMouseEnter={cancelHide}
          onMouseLeave={scheduleHide}
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
