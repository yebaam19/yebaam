import { SignalIcon, ArrowPathIcon, TrashIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  autoScroll: boolean;
  onToggleAutoScroll: () => void;
  onClearEvents: () => void;
}

export function PageHeader({ autoScroll, onToggleAutoScroll, onClearEvents }: PageHeaderProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
            <SignalIcon className="h-8 w-8 text-blue-500" />
            WebSocket Testing Dashboard
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Monitoreo en tiempo real de eventos de WebSocket
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onClearEvents}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
          >
            <TrashIcon className="h-5 w-5" />
            Limpiar
          </button>
          <button
            onClick={onToggleAutoScroll}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              autoScroll
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-400'
            )}
          >
            <ArrowPathIcon className="h-5 w-5" />
            Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
}
