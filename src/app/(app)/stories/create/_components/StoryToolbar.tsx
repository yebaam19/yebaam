'use client';

import { useTranslations } from 'next-intl';
import { TextStyleControls } from './TextStyleControls';
import { STORY_BACKGROUNDS } from '../../utils/colors';
import { StoryType } from '../../interfaces/stories.interfaces';
import {
  PhotoIcon,
  VideoCameraIcon,
  PaintBrushIcon,
  ArrowLeftIcon,
} from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';

type StoryBackground = (typeof STORY_BACKGROUNDS)[number];

interface Props {
  username: string;
  avatar?: string;
  storyType: StoryType | null;
  selectedFile: File | null;
  isCreating: boolean;
  maxVideoDuration: number;
  selectedBackground: StoryBackground;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  onBack: () => void;
  onSelectType: (type: StoryType) => void;
  onChangeFile: () => void;
  onPublish: () => void;
  onSelectBackground: (bg: StoryBackground) => void;
  onSelectFontSize: (size: number) => void;
  onSelectTextAlign: (align: 'left' | 'center' | 'right') => void;
}

/** Left sidebar (Facebook-style) for the story composer: back button, author
 *  card, the type picker / text-style controls / selected-file panel, and the
 *  discard / share footer. Purely controlled — the parent owns all state. */
export function StoryToolbar({
  username,
  avatar,
  storyType,
  selectedFile,
  isCreating,
  maxVideoDuration,
  selectedBackground,
  fontSize,
  textAlign,
  onBack,
  onSelectType,
  onChangeFile,
  onPublish,
  onSelectBackground,
  onSelectFontSize,
  onSelectTextAlign,
}: Props) {
  const t = useTranslations('stories.create');

  return (
    <aside className="relative flex h-full w-full max-w-sm flex-col border-r border-neutral-800 bg-neutral-900 shadow-2xl">
      {/* Header del sidebar */}
      <div className="flex items-center gap-3 border-b border-neutral-800 px-5 py-4">
        <button
          onClick={onBack}
          aria-label={t('back')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-white transition hover:bg-neutral-700"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">{t('title')}</h1>
      </div>

      {/* Tarjeta de usuario */}
      <div className="flex items-center gap-3 px-5 py-4">
        <Avatar
          initials={username.substring(0, 2).toUpperCase()}
          src={avatar}
          className="h-11 w-11 ring-2 ring-primary-500/40"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold">{username}</p>
          <p className="text-xs text-neutral-400">{t('visibleFor24h')}</p>
        </div>
      </div>

      {/* Contenido scrollable del sidebar */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {!storyType ? (
          <div className="space-y-3">
            <p className="mb-1 text-sm font-semibold text-neutral-300">{t('addToStory')}</p>

            <button
              onClick={() => onSelectType('image')}
              className="group flex w-full items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-800/60 p-4 text-left transition hover:border-primary-500/60 hover:bg-neutral-800"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600/20 text-primary-400 ring-1 ring-primary-500/40 transition group-hover:bg-primary-600 group-hover:text-white">
                <PhotoIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">{t('createWithPhoto')}</p>
                <p className="text-xs text-neutral-400">{t('shareImage')}</p>
              </div>
            </button>

            <button
              onClick={() => onSelectType('video')}
              className="group flex w-full items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-800/60 p-4 text-left transition hover:border-primary-500/60 hover:bg-neutral-800"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600/20 text-primary-400 ring-1 ring-primary-500/40 transition group-hover:bg-primary-600 group-hover:text-white">
                <VideoCameraIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">{t('createWithVideo')}</p>
                <p className="text-xs text-neutral-400">{t('upToSeconds', { seconds: maxVideoDuration })}</p>
              </div>
            </button>

            <button
              onClick={() => onSelectType('text')}
              className="group flex w-full items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-800/60 p-4 text-left transition hover:border-primary-500/60 hover:bg-neutral-800"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600/20 text-primary-400 ring-1 ring-primary-500/40 transition group-hover:bg-primary-600 group-hover:text-white">
                <PaintBrushIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">{t('createTextStory')}</p>
                <p className="text-xs text-neutral-400">{t('customBackgroundFont')}</p>
              </div>
            </button>
          </div>
        ) : storyType === 'text' ? (
          <TextStyleControls
            selectedBackground={selectedBackground}
            fontSize={fontSize}
            textAlign={textAlign}
            onSelectBackground={onSelectBackground}
            onSelectFontSize={onSelectFontSize}
            onSelectTextAlign={onSelectTextAlign}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-neutral-300">{t('selectedFile')}</p>
            <div className="rounded-xl border border-neutral-800 bg-neutral-800/60 p-4">
              <p className="truncate text-sm font-medium">{selectedFile?.name}</p>
              <p className="mt-1 text-xs text-neutral-400">
                {selectedFile && (selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={onChangeFile}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-800 py-2.5 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-700"
            >
              {t('changeFile')}
            </button>
          </div>
        )}
      </div>

      {/* Footer acciones */}
      <div className="border-t border-neutral-800 p-4">
        {storyType ? (
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 rounded-xl bg-neutral-800 py-3 font-semibold text-white transition hover:bg-neutral-700"
            >
              {t('discard')}
            </button>
            <button
              onClick={onPublish}
              disabled={isCreating}
              className="flex-1 rounded-xl bg-primary-600 py-3 font-semibold text-white shadow-lg transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-neutral-700"
            >
              {isCreating ? t('publishing') : t('share')}
            </button>
          </div>
        ) : (
          <p className="text-center text-xs text-neutral-500">
            {t('willBeVisible')}
          </p>
        )}
      </div>
    </aside>
  );
}
