import type { RefObject } from 'react';
import { CheckCircleIcon, SignalIcon } from '@/components/icons/heroicons-shim';
import { type FeedTranslator, type LiveStatus, formatDuration } from './types';

interface LiveVideoPreviewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  liveStatus: LiveStatus;
  countdown: number;
  viewerCount: number;
  duration: number;
  t: FeedTranslator;
}

export default function LiveVideoPreview({
  videoRef,
  liveStatus,
  countdown,
  viewerCount,
  duration,
  t,
}: LiveVideoPreviewProps) {
  return (
    <div className="relative aspect-video bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="h-full w-full object-cover"
      />

      {/* Countdown Overlay */}
      {liveStatus === 'countdown' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <div className="text-9xl font-bold text-white animate-pulse">
              {countdown}
            </div>
            <p className="mt-4 text-xl text-white">{t('liveVideo.startingBroadcast')}</p>
          </div>
        </div>
      )}

      {/* Live Stats Overlay */}
      {liveStatus === 'live' && (
        <>
          <div className="absolute top-4 left-4 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="text-sm font-bold text-white">{t('liveVideo.titleLive')}</span>
            </div>

            <div className="bg-black/70 px-3 py-1.5 rounded-full">
              <span className="text-sm font-semibold text-white">
                {formatDuration(duration)}
              </span>
            </div>
          </div>

          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-full">
              <SignalIcon className="h-4 w-4 text-green-400" />
              <span className="text-sm font-semibold text-white">
                {viewerCount} {viewerCount === 1 ? t('liveVideo.viewerSingular') : t('liveVideo.viewerPlural')}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Ending Overlay */}
      {liveStatus === 'ending' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <p className="text-2xl font-bold text-white">{t('liveVideo.broadcastFinished')}</p>
            <p className="mt-2 text-neutral-300">{t('liveVideo.savingVideo')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
