import { cn } from '@/lib/utils';
import {
  EVENT_CATEGORIES,
  getEventsByCategory,
  type SocketEvent,
} from '@/config/socket-events';

interface EventButtonsProps {
  isConnected: boolean;
  onEmitEvent: (eventName: string) => void;
}

export function EventButtons({ isConnected, onEmitEvent }: EventButtonsProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
        Emitir Eventos de Prueba
      </h2>
      <div className="space-y-6">
        {EVENT_CATEGORIES.map((category) => {
          const categoryEvents = getEventsByCategory(category.id as any);
          const emittableEvents = categoryEvents.filter((e) => e.isIncoming === false);
          const receivableEvents = categoryEvents.filter((e) => e.isIncoming !== false);

          return (
            <div key={category.id} className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-md font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
                {category.icon} {category.label}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {receivableEvents.map((event) => (
                  <EventButton
                    key={event.name}
                    event={event}
                    isConnected={isConnected}
                    onClick={() => onEmitEvent(event.name)}
                    variant="receive"
                  />
                ))}
              </div>
              {emittableEvents.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                    Eventos para emitir al servidor:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {emittableEvents.map((event) => (
                      <EventButton
                        key={event.name}
                        event={event}
                        isConnected={isConnected}
                        onClick={() => onEmitEvent(event.name)}
                        variant="emit"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface EventButtonProps {
  event: SocketEvent;
  isConnected: boolean;
  onClick: () => void;
  variant: 'receive' | 'emit';
}

function EventButton({ event, isConnected, onClick, variant }: EventButtonProps) {
  const baseClasses = cn(
    'px-4 py-3 rounded-lg font-medium transition-all text-left',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'border-2 border-transparent'
  );

  const variantClasses =
    variant === 'emit'
      ? 'bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/30 hover:border-green-500'
      : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 hover:border-blue-500';

  const textColorClasses =
    variant === 'emit'
      ? 'text-green-900 dark:text-green-300'
      : 'text-neutral-900 dark:text-white';

  const descriptionColorClasses =
    variant === 'emit'
      ? 'text-green-700 dark:text-green-400'
      : 'text-neutral-500 dark:text-neutral-400';

  return (
    <button
      onClick={onClick}
      disabled={!isConnected}
      className={cn(baseClasses, variantClasses)}
      title={event.description}
    >
      <div className="text-lg mb-1">{event.icon}</div>
      <div className={cn('text-xs font-semibold', textColorClasses)}>{event.name}</div>
      <div className={cn('text-xs truncate', descriptionColorClasses)}>
        {event.description}
      </div>
    </button>
  );
}
