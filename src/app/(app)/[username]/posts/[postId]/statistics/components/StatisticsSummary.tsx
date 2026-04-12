interface StatsSummaryCardProps {
  value: number;
  label: string;
}

function StatsSummaryCard({ value, label }: StatsSummaryCardProps) {
  return (
    <div className="text-center p-4 bg-gray-50 dark:bg-neutral-700 rounded-lg">
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value.toLocaleString()}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {label}
      </p>
    </div>
  );
}

interface StatisticsSummaryProps {
  totalReactions: number;
  totalComments: number;
  totalShares: number;
  totalViews?: number;
}

/**
 * Grid de resumen de estadísticas
 * Muestra tarjetas con métricas principales del post
 */
export function StatisticsSummary({ 
  totalReactions, 
  totalComments, 
  totalShares,
  totalViews 
}: StatisticsSummaryProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 mb-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Resumen
      </h2>
      
      <div className={`grid gap-4 ${totalViews ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <StatsSummaryCard value={totalReactions} label="Reacciones" />
        <StatsSummaryCard value={totalComments} label="Comentarios" />
        <StatsSummaryCard value={totalShares} label="Compartidos" />
        {totalViews !== undefined && (
          <StatsSummaryCard value={totalViews} label="Vistas" />
        )}
      </div>
    </div>
  );
}
