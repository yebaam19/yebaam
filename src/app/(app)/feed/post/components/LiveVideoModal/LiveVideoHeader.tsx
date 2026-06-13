import { DialogTitle } from '@headlessui/react';
import { XMarkIcon, VideoCameraIcon } from '@/components/icons/heroicons-shim';
import type { FeedTranslator, LiveStatus } from './types';

interface LiveVideoHeaderProps {
  liveStatus: LiveStatus;
  onClose: () => void;
  t: FeedTranslator;
}

export default function LiveVideoHeader({ liveStatus, onClose, t }: LiveVideoHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
      <DialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
        <VideoCameraIcon className="h-7 w-7 text-red-500" />
        {liveStatus === 'preparing' && t('liveVideo.titlePreparing')}
        {liveStatus === 'countdown' && t('liveVideo.titleCountdown')}
        {liveStatus === 'live' && (
          <span className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            {t('liveVideo.titleLive')}
          </span>
        )}
        {liveStatus === 'ending' && t('liveVideo.titleEnding')}
      </DialogTitle>
      <button
        onClick={onClose}
        disabled={liveStatus === 'ending'}
        className="rounded-full p-2 hover:bg-neutral-800 disabled:opacity-50"
      >
        <XMarkIcon className="h-6 w-6 text-neutral-400" />
      </button>
    </div>
  );
}
