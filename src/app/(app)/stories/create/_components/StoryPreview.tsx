'use client';

import { RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { STORY_BACKGROUNDS } from '../../utils/colors';
import { StoryType, FONT_SIZES, FONT_STYLES } from '../../interfaces/stories.interfaces';
import { cn } from '@/lib/utils';

type StoryBackground = (typeof STORY_BACKGROUNDS)[number];
type FontStyle = (typeof FONT_STYLES)[number];

interface Props {
  storyType: StoryType | null;
  previewUrl: string | null;
  textContent: string;
  selectedBackground: StoryBackground;
  fontSize: number;
  fontStyle: FontStyle;
  textAlign: 'left' | 'center' | 'right';
  videoRef: RefObject<HTMLVideoElement | null>;
  onTextChange: (value: string) => void;
}

/** Right-hand 9:16 live preview of the story: empty placeholder, editable text
 *  canvas, or image / video preview depending on the chosen type. */
export function StoryPreview({
  storyType,
  previewUrl,
  textContent,
  selectedBackground,
  fontSize,
  fontStyle,
  textAlign,
  videoRef,
  onTextChange,
}: Props) {
  const t = useTranslations('stories.create');

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-linear-to-br from-neutral-950 via-neutral-900 to-primary-950/40 p-8">
      {/* Glow decorativo */}
      <div className="pointer-events-none absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-primary-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl" />

      {!storyType ? (
        <div className="relative z-10 flex flex-col items-center gap-5 text-center">
          <div className="aspect-9/16 w-40 rounded-2xl border border-dashed border-neutral-700" />
          <h2 className="text-2xl font-semibold tracking-tight">{t('preview')}</h2>
          <p className="max-w-xs text-sm text-neutral-500">
            {t('chooseOption')}
          </p>
        </div>
      ) : (
        <div className="relative z-10 aspect-9/16 w-full max-w-[360px] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10">
          {storyType === 'text' && (
            <div
              className="flex h-full w-full items-center justify-center p-8"
              style={{ background: selectedBackground.value }}
            >
              <textarea
                value={textContent}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder={t('writeYourStory')}
                maxLength={250}
                style={{
                  color: selectedBackground.textColor,
                  fontSize: FONT_SIZES[fontSize],
                  textAlign: textAlign,
                }}
                className={cn(
                  'h-full w-full resize-none border-none bg-transparent text-center outline-none placeholder:opacity-60',
                  fontStyle.className
                )}
              />
            </div>
          )}

          {storyType === 'image' && previewUrl && (
            <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" decoding="async" loading="lazy" />
          )}

          {storyType === 'video' && previewUrl && (
            <video
              ref={videoRef}
              src={previewUrl}
              controls
              className="h-full w-full object-cover"
            />
          )}

          {storyType === 'text' && (
            <div className="absolute bottom-4 right-4 rounded-full bg-black/50 px-3 py-1 backdrop-blur-sm">
              <span className="text-sm font-medium text-white">{textContent.length}/250</span>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
