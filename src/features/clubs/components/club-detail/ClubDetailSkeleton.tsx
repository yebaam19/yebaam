/**
 * Componente skeleton loader para la página de detalle del club
 * Se muestra mientras se cargan los datos
 */
export function ClubDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse">
        {/* Cover Image Skeleton */}
        <div className="h-64 md:h-80 bg-gray-200 dark:bg-gray-700 rounded-lg mb-8" />

        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Profile Image */}
          <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0" />

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-8 border-b border-gray-200 dark:border-gray-700 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
