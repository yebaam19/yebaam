import type { StartLiveStreamResponse } from '@/features/live-stream/services/live-stream.service';
import type { FeedTranslator } from './types';

interface LiveVideoLivePanelProps {
  currentStream: StartLiveStreamResponse['liveStream'] | null;
  viewerCount: number;
  isEnding: boolean;
  onEnd: () => void;
  t: FeedTranslator;
}

export default function LiveVideoLivePanel({
  currentStream,
  viewerCount,
  isEnding,
  onEnd,
  t,
}: LiveVideoLivePanelProps) {
  return (
    <div className="p-6 space-y-4">
      {/* Stream Info */}
      {currentStream && (
        <div className="bg-neutral-800 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-white text-sm">{t('liveVideo.streamInfo')}</h3>
          <div className="space-y-1 text-xs text-neutral-400">
            <p>{t('liveVideo.streamIdLabel')} <span className="text-neutral-300 font-mono">{currentStream.id}</span></p>
            <p>{t('liveVideo.playbackUrlAvailable')}</p>
          </div>
        </div>
      )}

      <button
        onClick={onEnd}
        disabled={isEnding}
        className="w-full rounded-lg bg-red-600 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        {isEnding ? t('liveVideo.ending') : t('liveVideo.endButton')}
      </button>
      <p className="mt-3 text-xs text-center text-neutral-400">
        {viewerCount} {viewerCount === 1 ? t('liveVideo.watchingSingular') : t('liveVideo.watchingPlural')} {t('liveVideo.watchingSuffix')}
      </p>
    </div>
  );
}
