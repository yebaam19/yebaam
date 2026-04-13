import { UserIcon, SignalIcon } from '@/components/icons/heroicons-shim';

interface StatsCardsProps {
  connectedUsers: number;
  eventsCount: number;
  totalEvents: number;
}

export function StatsCards({ connectedUsers, eventsCount, totalEvents }: StatsCardsProps) {
  return (
    <>
      {/* Connected Users */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Usuarios Conectados
            </p>
            <p className="mt-2 text-4xl font-bold text-blue-600 dark:text-blue-400">
              {connectedUsers}
            </p>
          </div>
          <UserIcon className="h-12 w-12 text-blue-500" />
        </div>
      </div>

      {/* Events Received */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Eventos Recibidos
            </p>
            <p className="mt-2 text-4xl font-bold text-purple-600 dark:text-purple-400">
              {eventsCount}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Total: {totalEvents}
            </p>
          </div>
          <SignalIcon className="h-12 w-12 text-purple-500" />
        </div>
      </div>
    </>
  );
}
