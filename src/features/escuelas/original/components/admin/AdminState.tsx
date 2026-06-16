import EmptyState from '../ui/EmptyState';
import Skeleton from '../ui/Skeleton';
import type { ReactNode } from 'react';

export function AdminLoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Cargando...">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height="60px" className="w-full rounded-xl" />
      ))}
    </div>
  );
}

export function AdminErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-6" role="alert">
      <div className="flex items-start gap-3">
        <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-red-700">No se pudo cargar la información</p>
          <p className="mt-1 text-sm text-red-600">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return <EmptyState title={title} description={description}>{children}</EmptyState>;
}
