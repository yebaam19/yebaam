'use client';

import { useEffect, useState } from 'react';
import { getAxiosInstance } from '@/lib/legacy-api/client';
import { VideoCameraIcon, UserGroupIcon } from '@/components/icons/heroicons-shim';
import { SignalIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';

const axios = getAxiosInstance();

interface LiveStream {
  _id: string;
  title: string;
  description?: string;
  author: {
    id: string;
    username: string;
    firstName: string;
    lastName?: string;
    avatar?: string;
  };
  playbackUrl: string;
  stats: {
    viewerCount: number;
    peakViewerCount: number;
  };
  createdAt: string;
}

export default function ActiveStreamsBar() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveStreams();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchActiveStreams, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveStreams = async () => {
    try {
      const response = await axios.get('/live-streams/active');
      console.log(' [ActiveStreams] Streams activos:', response.data);
      setStreams(response.data.streams || []);
    } catch (error) {
      console.error('Error fetching active streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStreamClick = (stream: LiveStream) => {
    // TODO: Abrir modal de visualización de stream
    console.log('Abrir stream:', stream);
    window.open(stream.playbackUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="bg-neutral-900 border-b border-neutral-800 p-4">
        <div className="animate-pulse flex gap-4">
          <div className="h-24 w-40 bg-neutral-800 rounded-lg"></div>
          <div className="h-24 w-40 bg-neutral-800 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (streams.length === 0) {
    return null; // No mostrar nada si no hay streams activos
  }

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span className="text-sm font-bold text-white">EN VIVO</span>
        </div>
        <span className="text-neutral-400 text-sm">
          {streams.length} {streams.length === 1 ? 'transmisión activa' : 'transmisiones activas'}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {streams.map((stream) => (
          <button
            key={stream._id}
            onClick={() => handleStreamClick(stream)}
            className="shrink-0 w-72 bg-neutral-800 rounded-xl overflow-hidden hover:bg-neutral-750 transition-colors group"
          >
            {/* Thumbnail / Preview */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <VideoCameraIcon className="h-16 w-16 text-neutral-700" />
              
              {/* Live Badge */}
              <div className="absolute top-2 left-2">
                <div className="flex items-center gap-1.5 bg-red-600 px-2 py-1 rounded">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                  </span>
                  <span className="text-xs font-bold text-white">LIVE</span>
                </div>
              </div>

              {/* Viewers Count */}
              <div className="absolute bottom-2 right-2">
                <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2 py-1 rounded">
                  <SignalIcon className="h-3 w-3 text-green-400" />
                  <span className="text-xs font-semibold text-white">
                    {stream.stats.viewerCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-red-500 transition-colors">
                {stream.title}
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                {stream.author.firstName} {stream.author.lastName}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
