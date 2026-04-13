import { useRef, useEffect } from 'react';
import { SignalIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import { ALL_SOCKET_EVENTS } from '@/config/socket-events';

export interface ReceivedEvent {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  from?: string;
  category?: string;
  icon?: string;
  color?: string;
}

interface EventStreamProps {
  events: ReceivedEvent[];
  autoScroll: boolean;
}

export function EventStream({ events, autoScroll }: EventStreamProps) {
  const eventsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);

  const getEventColor = (color?: string) => {
    const colors: Record<string, string> = {
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
      cyan: 'bg-cyan-500',
      orange: 'bg-orange-500',
      neutral: 'bg-neutral-500',
    };
    return colors[color || 'neutral'] || 'bg-neutral-500';
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
        Stream de Eventos en Tiempo Real
      </h2>
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
            <SignalIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay eventos recibidos aún</p>
            <p className="text-sm mt-2">
              Emite un evento de prueba o espera eventos del servidor
            </p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{event.icon || ''}</span>
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-semibold text-white',
                        getEventColor(event.color)
                      )}
                    >
                      {event.type}
                    </span>
                    {event.category && (
                      <span className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-700 text-xs text-neutral-600 dark:text-neutral-400">
                        {event.category}
                      </span>
                    )}
                  </div>
                  <pre className="text-xs bg-neutral-50 dark:bg-neutral-900 p-3 rounded-lg overflow-x-auto text-neutral-800 dark:text-neutral-200">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 ml-4 whitespace-nowrap">
                  {event.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={eventsEndRef} />
      </div>
    </div>
  );
}
