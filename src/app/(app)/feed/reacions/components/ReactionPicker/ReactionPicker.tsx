import { REACTION_CONFIGS, ReactionType } from '../../interfaces/reaction.interfaces';

interface ReactionPickerProps {
  onSelect: (type: ReactionType) => void;
  currentReaction?: ReactionType;
}

/**
 * Picker flotante con las 6 reacciones disponibles, estilo Facebook.
 * Centrado horizontalmente sobre el botón ancla. El elemento padre debe
 * tener `position: relative`.
 */
export function ReactionPicker({ onSelect, currentReaction }: ReactionPickerProps) {
  const reactions = Object.values(ReactionType);

  return (
    <div
      className="
        absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30
        flex items-center gap-1
        bg-white dark:bg-gray-800
        rounded-full shadow-lg
        p-2 border border-gray-200 dark:border-gray-700
        animate-in fade-in zoom-in-95 duration-200
      "
      role="menu"
      aria-label="Seleccionar reacción"
    >
      {reactions.map(type => {
        const config = REACTION_CONFIGS[type];
        const isSelected = currentReaction === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={`
              relative group
              w-10 h-10 rounded-full
              flex items-center justify-center
              transition-all duration-200
              hover:scale-125 hover:-translate-y-1
              ${isSelected ? 'scale-110' : ''}
            `}
            aria-label={config.label}
            title={config.label}
            role="menuitem"
          >
            <span
              className="text-2xl transition-transform group-hover:scale-110"
              aria-hidden="true"
            >
              {config.emoji}
            </span>

            {isSelected && (
              <span
                className="
                  absolute -bottom-1 w-1 h-1
                  rounded-full bg-blue-500
                "
                aria-hidden="true"
              />
            )}

            <span
              className="
                absolute -top-8 left-1/2 -translate-x-1/2
                px-2 py-1 rounded
                bg-gray-900 dark:bg-gray-700
                text-white text-xs font-medium
                whitespace-nowrap
                opacity-0 group-hover:opacity-100
                transition-opacity duration-200
                pointer-events-none
              "
            >
              {config.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
