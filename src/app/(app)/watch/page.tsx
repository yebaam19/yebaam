import type { Metadata } from 'next';
import { listWatchVideos } from '@/features/watch/server/watch.server';
import { WatchFeed } from './components/WatchFeed';

export const metadata: Metadata = {
  title: 'Videos',
  description: 'Mira los videos que la comunidad está publicando.',
};

export const dynamic = 'force-dynamic';

export default async function WatchPage() {
  const videos = await listWatchVideos(60);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Videos</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Todos los videos publicados por usuarios — del feed, galerías y comunidades.
        </p>
      </header>
      <WatchFeed videos={videos} />
    </div>
  );
}
