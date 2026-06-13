import { VideoCameraIcon, SignalIcon } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import { getUserAvatarUrl } from '@/lib/utils/avatar';
import type { AuthUser } from '@/features/auth';
import { type FeedTranslator, type Privacy, VISIBILITY_OPTIONS } from './types';

interface LiveVideoPreparePanelProps {
  user: AuthUser;
  privacy: Privacy;
  title: string;
  description: string;
  isStarting: boolean;
  onPrivacyChange: (privacy: Privacy) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onStart: () => void;
  t: FeedTranslator;
}

export default function LiveVideoPreparePanel({
  user,
  privacy,
  title,
  description,
  isStarting,
  onPrivacyChange,
  onTitleChange,
  onDescriptionChange,
  onStart,
  t,
}: LiveVideoPreparePanelProps) {
  return (
    <div className="p-6 space-y-4">
      {/* User Info */}
      <div className="flex items-center gap-3">
        <Avatar src={getUserAvatarUrl(user)} className="h-12 w-12" />
        <div className="flex-1">
          <p className="font-semibold text-white">
            {user.lastName || user.username}
          </p>
          {/* Privacy Selector */}
          <select
            value={privacy}
            onChange={(e) => onPrivacyChange(e.target.value as Privacy)}
            className="mt-1 rounded-md border-0 bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-300"
          >
            {VISIBILITY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {t(`visibilityOptions.${option.labelKey}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Title */}
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={t('liveVideo.titlePlaceholder')}
        maxLength={100}
        className="w-full rounded-lg border-0 bg-neutral-800 px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500"
      />

      {/* Description */}
      <textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder={t('liveVideo.descriptionPlaceholder')}
        maxLength={200}
        rows={3}
        className="w-full resize-none rounded-lg border-0 bg-neutral-800 px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500"
      />
      <p className="text-xs text-neutral-500 text-right">
        {description.length}/200
      </p>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-neutral-800 rounded-lg p-4">
          <VideoCameraIcon className="h-6 w-6 text-red-500 mb-2" />
          <p className="text-sm font-semibold text-white">{t('liveVideo.hdQuality')}</p>
          <p className="text-xs text-neutral-400">{t('liveVideo.hdQualityDetail')}</p>
        </div>
        <div className="bg-neutral-800 rounded-lg p-4">
          <SignalIcon className="h-6 w-6 text-green-500 mb-2" />
          <p className="text-sm font-semibold text-white">{t('liveVideo.stableConnection')}</p>
          <p className="text-xs text-neutral-400">{t('liveVideo.stableConnectionDetail')}</p>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={onStart}
        disabled={!title.trim() || isStarting}
        className="w-full rounded-lg bg-red-600 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      >
        {isStarting ? t('liveVideo.starting') : t('liveVideo.startButton')}
      </button>

      {/* Note */}
      <p className="text-xs text-center text-neutral-500">
         {t('liveVideo.autoSaveNote')}
      </p>
    </div>
  );
}
